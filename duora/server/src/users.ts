/**
 * User data helpers.
 *
 * Kept out of the route file so the auth guard and the routes can both use
 * them without an import cycle.
 */
import { db } from './db';
import { nowIso } from './util';
import { id } from './util';

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

/** Creates a user row. Throws when the email is already taken. */
export async function createUser(input: {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  partnerNickname?: string | null;
}): Promise<UserRow> {
  const now = nowIso();
  const userId = id('usr');
  await db().run(
    `INSERT INTO users (id, email, password_hash, display_name, avatar_url, partner_nickname, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.email.toLowerCase(),
      input.passwordHash,
      input.displayName,
      input.avatarUrl ?? null,
      input.partnerNickname ?? null,
      now,
      now,
    ],
  );
  const row = await findById(userId);
  if (!row) throw new Error('user could not be created');
  return row;
}

/** Updates the profile fields the app can change. */
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
