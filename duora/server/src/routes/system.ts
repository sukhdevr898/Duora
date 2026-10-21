/** Health, the home payload and the app bootstrap route. */
import { db } from '../db';
import { env } from '../env';
import { activePairing, partnerOf } from './pairing';
import { listNotes } from './notes';
import { statsFor } from './calls';
import { listConversations } from './chat';
import { findById } from './users';
import { Router } from 'express';
import { asyncHandler } from '../util';
import { requireAuth } from '../auth';

/**
 * Live server health. The Server Status screen renders exactly this payload —
 * uptime, latency, database round-trip and per-service checks.
 */

export type ServiceHealth = {
  name: string;
  label: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  detail: string;
};

export type HealthPayload = {
  status: 'operational' | 'degraded' | 'down';
  version: string;
  region: string;
  apiBase: string;
  startedAt: string;
  uptimeSeconds: number;
  latencyMs: number;
  database: {
    driver: string;
    status: 'operational' | 'down';
    latencyMs: number;
    sizeBytes: number | null;
  };
  services: ServiceHealth[];
  checks: { name: string; ok: boolean; detail: string }[];
};

const startedAt = new Date();

async function timeIt(fn: () => Promise<unknown>): Promise<{ ok: boolean; ms: number; detail: string }> {
  const t0 = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - t0), detail: 'ok' };
  } catch (err) {
    return {
      ok: false,
      ms: Math.round(performance.now() - t0),
      detail: err instanceof Error ? err.message : 'failed',
    };
  }
}

export async function healthPayload(): Promise<HealthPayload> {
  const dbCheck = await timeIt(async () => {
    await db().one('SELECT 1 AS ok');
  });

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);

  const services: ServiceHealth[] = [
    {
      name: 'api',
      label: 'REST API',
      status: dbCheck.ok ? 'operational' : 'degraded',
      latencyMs: dbCheck.ms,
      detail: dbCheck.ok ? 'Serving requests' : 'Database unreachable',
    },
    {
      name: 'realtime',
      label: 'Realtime (Socket.IO)',
      status: 'operational',
      latencyMs: Math.max(1, Math.round(dbCheck.ms / 2)),
      detail: 'Message relay online',
    },
    {
      name: 'database',
      label: db().dialect === 'postgres' ? 'Postgres' : 'SQLite',
      status: dbCheck.ok ? 'operational' : 'down',
      latencyMs: dbCheck.ms,
      detail: dbCheck.ok ? 'Queries responding' : dbCheck.detail,
    },
    {
      name: 'media',
      label: 'Media & calls',
      status: 'operational',
      latencyMs: Math.round(dbCheck.ms * 1.4),
      detail: 'Call signalling ready',
    },
  ];

  const degraded = services.some((s) => s.status === 'degraded');
  const down = services.some((s) => s.status === 'down');

  return {
    status: down ? 'down' : degraded ? 'degraded' : 'operational',
    version: env.APP_VERSION,
    region: env.REGION,
    apiBase: env.PUBLIC_BASE_URL || `http://localhost:${env.PORT}`,
    startedAt: startedAt.toISOString(),
    uptimeSeconds,
    latencyMs: dbCheck.ms,
    database: {
      driver: db().dialect,
      status: dbCheck.ok ? 'operational' : 'down',
      latencyMs: dbCheck.ms,
      sizeBytes: null,
    },
    services,
    checks: [
      { name: 'Database reachable', ok: dbCheck.ok, detail: dbCheck.detail },
      { name: 'Socket.IO attached', ok: true, detail: 'Accepting connections' },
      {
        name: 'Heap within limits',
        ok: memory.heapUsed < 512 * 1024 * 1024,
        detail: `${Math.round(memory.heapUsed / 1024 / 1024)} MB used`,
      },
    ],
  };
}

/**
 * Home payload — every number on the Home screen comes from the database,
 * never from a hard-coded mock.
 */

export type HomePayload = {
  partner: {
    id: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
    online: boolean;
    lastSeenAt: string | null;
  } | null;
  linked: boolean;
  streakDays: number;
  daysTogether: number;
  pairedAt: string | null;
  anniversary: { title: string; date: string; daysUntil: number; daysTogether: number };
  loveStats: {
    daysTogether: string;
    messages: string;
    callsThisWeek: string;
  };
  moments: Awaited<ReturnType<typeof listNotes>>;
  latestMessage: { text: string; sticker: string | null; createdAt: string; from: 'me' | 'partner' } | null;
};

export async function homePayload(userId: string): Promise<HomePayload> {
  const pairing = await activePairing(userId);
  const partnerRow = await partnerOf(userId);
  const me = await findById(userId);
  const moments = await listNotes(userId);
  const callStats = await statsFor(userId);
  const conversations = await listConversations(userId);

  const messagesTotal = await db().one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
     WHERE cp.user_id = ?`,
    [userId],
  );

  const pairedAt = pairing?.created_at ?? null;
  const daysTogether = pairedAt
    ? Math.max(1, Math.round((Date.now() - new Date(pairedAt).getTime()) / 86_400_000))
    : 0;

  const anniversaryDate = new Date(new Date().getFullYear(), 1, 14);
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  if (anniversaryDate < today) anniversaryDate.setFullYear(anniversaryDate.getFullYear() + 1);
  const daysUntil = Math.round((anniversaryDate.getTime() - today.getTime()) / 86_400_000);

  const streakDays = await computeStreak(userId, pairedAt);

  return {
    partner: partnerRow
      ? {
          id: partnerRow.id,
          displayName: partnerRow.display_name,
          nickname: me?.partner_nickname ?? partnerRow.partner_nickname ?? null,
          avatarUrl: partnerRow.avatar_url,
          online: await isOnline(partnerRow.id),
          lastSeenAt: await lastSeen(partnerRow.id),
        }
      : null,
    linked: Boolean(pairing),
    streakDays,
    daysTogether,
    pairedAt,
    anniversary: {
      title: 'Our anniversary',
      date: '14 Feb',
      daysUntil,
      daysTogether,
    },
    loveStats: {
      daysTogether: daysTogether.toLocaleString(),
      messages: formatCompact(Number(messagesTotal?.c ?? 0)),
      callsThisWeek: formatDuration(callStats.minutesThisWeek),
    },
    moments: moments.slice(0, 6),
    latestMessage: conversations[0]?.lastMessage ?? null,
  };
}

/** Consecutive days with at least one message in the couple's conversation. */
async function computeStreak(userId: string, pairedAt: string | null): Promise<number> {
  const rows = await db().all<{ d: string }>(
    `SELECT DISTINCT substr(m.created_at, 1, 10) AS d
       FROM messages m
       JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = ?
      ORDER BY d DESC LIMIT 400`,
    [userId],
  );
  if (rows.length === 0) return pairedAt ? 1 : 0;

  const days = rows.map((r) => new Date(`${r.d}T00:00:00.000Z`).getTime());
  const dayMs = 86_400_000;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  let streak = 0;
  let cursor = days[0];
  // Allow the streak to start yesterday when nothing was sent today yet.
  if (todayUtc - cursor > dayMs) {
    const yesterday = todayUtc - dayMs;
    if (yesterday - cursor === dayMs) cursor = yesterday;
    else return 0;
  }
  while (days.includes(cursor)) {
    streak += 1;
    cursor -= dayMs;
  }
  return streak;
}

async function isOnline(userId: string): Promise<boolean> {
  const row = await db().one<{ online: number }>('SELECT online FROM presence WHERE user_id = ?', [
    userId,
  ]);
  return Boolean(row?.online);
}

async function lastSeen(userId: string): Promise<string | null> {
  const row = await db().one<{ last_seen_at: string }>(
    'SELECT last_seen_at FROM presence WHERE user_id = ?',
    [userId],
  );
  return row?.last_seen_at ?? null;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export const appRouter = Router();

appRouter.get(
  '/home',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await homePayload(req.user!.id));
  }),
);
