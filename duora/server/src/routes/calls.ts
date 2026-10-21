/** Call log, start and end calls. */
import { db } from '../db';
import { ApiError, id, nowIso, asyncHandler } from '../util';
import { partnerOf } from './pairing';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { validate, validatedQuery } from '../http';

export type CallRow = {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: string;
  status: string;
  end_reason: string | null;
  started_at: string | null;
  connected_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CallLogItem = {
  id: string;
  type: 'Outgoing Call' | 'Incoming Call' | 'Missed Call' | 'Video Call';
  kind: 'voice' | 'video';
  missed: boolean;
  time: string;
  day: string;
  duration: string | null;
  clock: string;
  createdAt: string;
};

export async function listCalls(userId: string, limit = 50): Promise<CallLogItem[]> {
  const rows = await db().all<CallRow>(
    `SELECT * FROM call_sessions
     WHERE caller_id = ? OR callee_id = ?
     ORDER BY created_at DESC LIMIT ?`,
    [userId, userId, limit],
  );

  return rows.map((row) => {
    const outgoing = row.caller_id === userId;
    const video = row.call_type === 'VIDEO';
    const missed = row.status === 'MISSED';
    const created = new Date(row.created_at);
    return {
      id: row.id,
      type: video
        ? 'Video Call'
        : missed
          ? 'Missed Call'
          : outgoing
            ? 'Outgoing Call'
            : 'Incoming Call',
      kind: video ? 'video' : 'voice',
      missed,
      time: created.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      day: formatDay(created),
      duration: durationBetween(row.connected_at, row.ended_at),
      clock: created.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      createdAt: row.created_at,
    };
  });
}

export async function startCall(
  userId: string,
  kind: 'voice' | 'video',
): Promise<CallLogItem> {
  const partner = await partnerOf(userId);
  if (!partner) throw ApiError.badRequest('Pair with a partner before calling');

  const now = nowIso();
  const callId = id('call');
  await db().run(
    `INSERT INTO call_sessions (id, caller_id, callee_id, call_type, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'RINGING', ?, ?)`,
    [callId, userId, partner.id, kind === 'video' ? 'VIDEO' : 'AUDIO', now, now],
  );

  const row = await db().one<CallRow>('SELECT * FROM call_sessions WHERE id = ?', [callId]);
  const [item] = await listCalls(userId, 1);
  return item ?? {
    id: row!.id,
    type: kind === 'video' ? 'Video Call' : 'Outgoing Call',
    kind,
    missed: false,
    time: '',
    day: '',
    duration: null,
    clock: '',
    createdAt: now,
  };
}

export async function endCall(
  userId: string,
  callId: string,
  outcome: 'ENDED' | 'DECLINED' | 'CANCELLED' | 'MISSED' | 'FAILED' = 'ENDED',
): Promise<CallLogItem> {
  const row = await db().one<CallRow>('SELECT * FROM call_sessions WHERE id = ?', [callId]);
  if (!row) throw ApiError.notFound('Call not found');
  if (row.caller_id !== userId && row.callee_id !== userId) {
    throw ApiError.forbidden('That call is not yours');
  }
  const now = nowIso();
  await db().run(
    `UPDATE call_sessions
        SET status = ?, end_reason = ?, ended_at = ?, started_at = COALESCE(started_at, ?), updated_at = ?
      WHERE id = ?`,
    [outcome, outcome, now, now, now, callId],
  );

  const item = (await listCalls(userId, 50)).find((call) => call.id === callId);
  if (!item) throw ApiError.notFound('Call not found');
  return item;
}

export async function statsFor(userId: string): Promise<{
  totalCalls: number;
  minutesThisWeek: number;
}> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const rows = await db().all<{ connected_at: string | null; ended_at: string | null }>(
    `SELECT connected_at, ended_at FROM call_sessions
     WHERE (caller_id = ? OR callee_id = ?) AND created_at >= ?`,
    [userId, userId, weekAgo],
  );
  let seconds = 0;
  for (const row of rows) {
    if (!row.connected_at || !row.ended_at) continue;
    seconds += Math.max(0, (new Date(row.ended_at).getTime() - new Date(row.connected_at).getTime()) / 1000);
  }
  const total = await db().one<{ c: number }>(
    'SELECT COUNT(*) AS c FROM call_sessions WHERE caller_id = ? OR callee_id = ?',
    [userId, userId],
  );
  return { totalCalls: Number(total?.c ?? 0), minutesThisWeek: Math.round(seconds / 60) };
}

function durationBetween(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const total = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function formatDay(date: Date): string {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const startSchema = z.object({ kind: z.enum(['voice', 'video']).default('voice') });
const endSchema = z.object({
  outcome: z.enum(['ENDED', 'DECLINED', 'CANCELLED', 'MISSED', 'FAILED']).default('ENDED'),
});
const listSchema = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

export const callsRouter = Router();
callsRouter.use(requireAuth);

callsRouter.get(
  '/',
  validate(listSchema, 'query'),
  asyncHandler(async (req, res) => {
    const limit = validatedQuery<{ limit: number }>(req)?.limit ?? 50;
    res.json({ calls: await listCalls(req.user!.id, limit) });
  }),
);

callsRouter.post(
  '/',
  validate(startSchema),
  asyncHandler(async (req, res) => {
    const { kind } = req.body as { kind: 'voice' | 'video' };
    res.status(201).json({ call: await startCall(req.user!.id, kind) });
  }),
);

callsRouter.post(
  '/:callId/end',
  validate(endSchema),
  asyncHandler(async (req, res) => {
    const { outcome } = req.body as { outcome: 'ENDED' | 'DECLINED' | 'CANCELLED' | 'MISSED' | 'FAILED' };
    const call = await endCall(req.user!.id, req.params.callId, outcome);
    res.json({ call });
  }),
);
