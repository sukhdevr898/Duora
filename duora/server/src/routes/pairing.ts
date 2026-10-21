/** Pairing by 6-character code or QR code. */
import { z } from 'zod';
import { db } from '../db';
import { env } from '../env';
import { ApiError, id, nowIso, pairingCode, pairingToken, asyncHandler } from '../util';
import { findById, toPublicUser, type UserRow } from './users';
import { Router } from 'express';
import { requireAuth } from '../auth';
import { validate } from '../http';

export const acceptByCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'The pairing code has 6 characters')
    .max(6, 'The pairing code has 6 characters')
    .regex(/^[A-Za-z0-9]+$/, 'The pairing code only uses letters and numbers')
    .transform((s) => s.toUpperCase()),
});

export const acceptByTokenSchema = z.object({
  token: z.string().min(8),
});

export const scanSchema = z.object({
  data: z.string().min(8),
});

export type PairingPhase = 'idle' | 'outgoing' | 'incoming' | 'matched';

export type PairingStatus = {
  phase: PairingPhase;
  code: string | null;
  qrPayload: string | null;
  expiresAt: string | null;
  matchedAt: string | null;
  partner: {
    id: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
  conversationId: string | null;
};

export type PairingRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: string;
  created_at: string;
  unlinked_at: string | null;
};

export type InvitationRow = {
  id: string;
  code: string;
  token: string;
  created_by_id: string;
  consumed_by_id: string | null;
  status: string;
  attempt_count: number;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

/** Builds the payload encoded into the pairing QR code. */
export function qrPayload(token: string): string {
  return `duora://pair?token=${token}`;
}

export async function activePairing(userId: string): Promise<PairingRow | null> {
  return db().one<PairingRow>(
    `SELECT * FROM pairings
     WHERE status = 'ACTIVE' AND (user_a_id = ? OR user_b_id = ?)
     ORDER BY created_at DESC LIMIT 1`,
    [userId, userId],
  );
}

export async function pendingInvitation(userId: string): Promise<InvitationRow | null> {
  return db().one<InvitationRow>(
    `SELECT * FROM pairing_invitations
     WHERE created_by_id = ? AND status = 'PENDING' AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    [userId, nowIso()],
  );
}

/** Creates (or reuses) the 6-character code + QR token for this user. */
export async function createInvitation(userId: string): Promise<{
  code: string;
  token: string;
  qrPayload: string;
  expiresAt: string;
}> {
  const existing = await pendingInvitation(userId);
  if (existing) {
    return {
      code: existing.code,
      token: existing.token,
      qrPayload: qrPayload(existing.token),
      expiresAt: existing.expires_at,
    };
  }

  // Expire stale invitations first so codes stay short-lived.
  await db().run(
    `UPDATE pairing_invitations SET status = 'EXPIRED' WHERE created_by_id = ? AND status = 'PENDING'`,
    [userId],
  );

  const code = pairingCode(6);
  const token = pairingToken();
  const expiresAt = new Date(Date.now() + env.PAIRING_TTL_MINUTES * 60_000).toISOString();

  await db().run(
    `INSERT INTO pairing_invitations
       (id, code, token, created_by_id, status, attempt_count, expires_at, created_at)
     VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
    [id('inv'), code, token, userId, expiresAt, nowIso()],
  );

  return { code, token, qrPayload: qrPayload(token), expiresAt };
}

export async function findInvitationByCode(code: string): Promise<InvitationRow | null> {
  return db().one<InvitationRow>('SELECT * FROM pairing_invitations WHERE code = ?', [
    code.toUpperCase().trim(),
  ]);
}

export async function findInvitationByToken(token: string): Promise<InvitationRow | null> {
  return db().one<InvitationRow>('SELECT * FROM pairing_invitations WHERE token = ?', [token]);
}

/** Accepts a partner by 6-char code. The requester becomes user B. */
export async function acceptByCode(userId: string, rawCode: string): Promise<PairingStatus> {
  const code = rawCode.toUpperCase().trim();
  const invitation = await findInvitationByCode(code);

  if (!invitation) throw ApiError.notFound('That pairing code does not exist');
  if (invitation.status === 'USED') throw ApiError.conflict('That code has already been used');
  if (invitation.status === 'EXPIRED') throw ApiError.badRequest('That code has expired');
  if (new Date(invitation.expires_at) < new Date()) {
    await db().run(`UPDATE pairing_invitations SET status = 'EXPIRED' WHERE id = ?`, [invitation.id]);
    throw ApiError.badRequest('That code has expired');
  }
  if (invitation.created_by_id === userId) {
    throw ApiError.badRequest('That is your own code — ask your partner for theirs');
  }

  await db().run('UPDATE pairing_invitations SET attempt_count = attempt_count + 1 WHERE id = ?', [
    invitation.id,
  ]);

  return linkPairing(invitation.created_by_id, userId, invitation.id);
}

/** Accepts a partner by scanning their QR token. */
export async function acceptByToken(userId: string, token: string): Promise<PairingStatus> {
  const invitation = await findInvitationByToken(token);
  if (!invitation) throw ApiError.notFound('That QR code is not valid');
  if (invitation.status === 'USED') throw ApiError.conflict('That QR code has already been used');
  if (invitation.status === 'EXPIRED' || new Date(invitation.expires_at) < new Date()) {
    await db().run(`UPDATE pairing_invitations SET status = 'EXPIRED' WHERE id = ?`, [invitation.id]);
    throw ApiError.badRequest('That QR code has expired');
  }
  if (invitation.created_by_id === userId) {
    throw ApiError.badRequest('That is your own QR code — ask your partner for theirs');
  }
  return linkPairing(invitation.created_by_id, userId, invitation.id);
}

/** Creates the mutual pairing + conversation in one shot. */
async function linkPairing(
  inviterId: string,
  inviteeId: string,
  invitationId: string,
): Promise<PairingStatus> {
  const inviter = await findById(inviterId);
  const invitee = await findById(inviteeId);
  if (!inviter || !invitee) throw ApiError.internal('One of the accounts no longer exists');

  const existing = await activePairing(inviteeId);
  if (existing) throw ApiError.conflict('You are already paired');

  const now = nowIso();
  const pairingId = id('pr');
  const conversationId = id('cv');

  await db().transaction(async (tx) => {
    await tx.run(
      `INSERT INTO pairings (id, user_a_id, user_b_id, status, created_at) VALUES (?, ?, ?, 'ACTIVE', ?)`,
      [pairingId, inviterId, inviteeId, now],
    );
    await tx.run(
      `INSERT INTO conversations (id, pairing_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      [conversationId, pairingId, now, now],
    );
    await tx.run(
      `INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?), (?, ?, ?)`,
      [conversationId, inviterId, now, conversationId, inviteeId, now],
    );
    await tx.run(
      `UPDATE pairing_invitations SET status = 'USED', consumed_by_id = ?, used_at = ? WHERE id = ?`,
      [inviteeId, now, invitationId],
    );
  });

  return statusFor(inviteeId);
}

export async function unlink(userId: string): Promise<PairingStatus> {
  const pairing = await activePairing(userId);
  if (!pairing) return statusFor(userId);
  const now = nowIso();
  await db().run(`UPDATE pairings SET status = 'UNLINKED', unlinked_at = ? WHERE id = ?`, [now, pairing.id]);
  return statusFor(userId);
}

/** Full pairing state for the client — drives the Pairing screen UI. */
export async function statusFor(userId: string): Promise<PairingStatus> {
  const pairing = await activePairing(userId);

  if (pairing) {
    const partnerId = pairing.user_a_id === userId ? pairing.user_b_id : pairing.user_a_id;
    const partner = await findById(partnerId);
    const conversation = await db().one<{ id: string }>(
      'SELECT id FROM conversations WHERE pairing_id = ?',
      [pairing.id],
    );
    const invitation = await db().one<{ code: string; expires_at: string }>(
      `SELECT code, expires_at FROM pairing_invitations
       WHERE created_by_id = ? AND status = 'PENDING' AND expires_at > ?`,
      [userId, nowIso()],
    );
    // The code that actually paired the two of us (may be used or expired).
    const pairedCode = await db().one<{ code: string }>(
      `SELECT code FROM pairing_invitations
       WHERE created_by_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    const me = await findById(userId);

    return {
      phase: 'matched',
      code: invitation?.code ?? pairedCode?.code ?? null,
      qrPayload: null,
      expiresAt: invitation?.expires_at ?? null,
      matchedAt: pairing.created_at,
      partner: partner
        ? {
            id: partner.id,
            displayName: partner.display_name,
            // The name *I* call my partner by.
            nickname: me?.partner_nickname ?? partner.partner_nickname,
            avatarUrl: partner.avatar_url,
          }
        : null,
      conversationId: conversation?.id ?? null,
    };
  }

  const invitation = await pendingInvitation(userId);
  if (invitation) {
    return {
      phase: 'outgoing',
      code: invitation.code,
      qrPayload: qrPayload(invitation.token),
      expiresAt: invitation.expires_at,
      matchedAt: null,
      partner: null,
      conversationId: null,
    };
  }

  return {
    phase: 'idle',
    code: null,
    qrPayload: null,
    expiresAt: null,
    matchedAt: null,
    partner: null,
    conversationId: null,
  };
}

/** Small helper used by the chat module to resolve the partner of a user. */
export async function partnerOf(userId: string): Promise<UserRow | null> {
  const pairing = await activePairing(userId);
  if (!pairing) return null;
  const partnerId = pairing.user_a_id === userId ? pairing.user_b_id : pairing.user_a_id;
  return findById(partnerId);
}

export async function conversationIdFor(userId: string): Promise<string | null> {
  const pairing = await activePairing(userId);
  if (!pairing) return null;
  const conversation = await db().one<{ id: string }>(
    'SELECT id FROM conversations WHERE pairing_id = ?',
    [pairing.id],
  );
  return conversation?.id ?? null;
}

export { toPublicUser };

export const pairingRouter = Router();
pairingRouter.use(requireAuth);

/** Everything the Pairing screen needs in one call. */
pairingRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json(await statusFor(req.user!.id));
  }),
);

/** Create / refresh the 6-char code + QR payload. */
pairingRouter.post(
  '/invitation',
  asyncHandler(async (req, res) => {
    res.status(201).json(await createInvitation(req.user!.id));
  }),
);

/** Partner entered a code. */
pairingRouter.post(
  '/accept',
  validate(acceptByCodeSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.body as { code: string };
    res.json(await acceptByCode(req.user!.id, code));
  }),
);

/** Partner scanned a QR code. */
pairingRouter.post(
  '/scan',
  validate(acceptByTokenSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token: string };
    res.json(await acceptByToken(req.user!.id, token));
  }),
);

/** Raw QR payload → token (supports `duora://pair?token=…` and bare tokens). */
pairingRouter.post(
  '/resolve',
  validate(scanSchema),
  asyncHandler(async (req, res) => {
    const raw = (req.body as { data: string }).data.trim();
    const token = raw.includes('token=')
      ? new URL(raw.replace('duora://', 'https://')).searchParams.get('token') ?? ''
      : raw;
    res.json({ token });
  }),
);

pairingRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await unlink(req.user!.id));
  }),
);
