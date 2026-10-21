/** Profile and the public user shape. */
import { db } from '../db';
import { nowIso, asyncHandler } from '../util';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { validate } from '../http';

/** The profile fields the app can change. */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  partnerNickname: z.string().min(1).max(40).nullable().optional(),
});

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  partner_nickname: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  partnerNickname: string | null;
  createdAt: string;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    partnerNickname: row.partner_nickname,
    createdAt: row.created_at,
  };
}

export async function findById(userId: string): Promise<UserRow | null> {
  return db().one<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  return db().one<UserRow>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string; avatarUrl?: string | null; partnerNickname?: string | null },
): Promise<PublicUser | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.displayName !== undefined) {
    fields.push('display_name = ?');
    params.push(patch.displayName);
  }
  if (patch.avatarUrl !== undefined) {
    fields.push('avatar_url = ?');
    params.push(patch.avatarUrl);
  }
  if (patch.partnerNickname !== undefined) {
    fields.push('partner_nickname = ?');
    params.push(patch.partnerNickname);
  }
  if (fields.length === 0) {
    const existing = await findById(userId);
    return existing ? toPublicUser(existing) : null;
  }
  fields.push('updated_at = ?');
  params.push(nowIso(), userId);
  await db().run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  const updated = await findById(userId);
  return updated ? toPublicUser(updated) : null;
}

/** Ensures a settings row exists so clients always get a full object. */
export async function ensureSettings(userId: string): Promise<void> {
  const existing = await db().one('SELECT user_id FROM user_settings WHERE user_id = ?', [userId]);
  if (existing) return;
  await db().run(
    `INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)`,
    [userId, nowIso()],
  );
}

export const usersRouter = Router();

usersRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findById(req.user!.id);
    res.json({ user: user ? toPublicUser(user) : null });
  }),
);

usersRouter.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.user!.id, req.body as never);
    res.json({ user });
  }),
);
