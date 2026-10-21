/**
 * Supabase integration — optional.
 *
 * The Duora API always talks to Supabase Postgres directly (see `db.ts`).
 * On top of that it can also use **Supabase Auth** as the identity provider:
 *
 *   • `POST /api/v1/auth/login` falls back to Supabase Auth when the local
 *     password does not match, so the couple can sign in with the account
 *     they created in the Supabase dashboard.
 *   • Every protected route also accepts a **Supabase access token**, which is
 *     verified with the project's JWKS (no secret key needed).
 *   • `POST /api/v1/auth/register` mirrors the new account into Supabase Auth
 *     when a secret key is configured.
 *
 * Everything is optional: without `SUPABASE_URL` the server behaves exactly as
 * before (its own email + password auth).
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env, logger } from './env';

export type SupabaseUser = {
  /** The Supabase user id (`auth.users.id`). */
  id: string;
  email: string;
  displayName: string;
};

export type SupabaseSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/** True when a Supabase project is configured. */
export function supabaseEnabled(): boolean {
  return Boolean(env.SUPABASE_URL);
}

/** True when the server may call the Supabase admin API. */
export function supabaseAdminEnabled(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY);
}

/** The JWKS endpoint of the project. */
export function supabaseJwksUrl(): string {
  return env.SUPABASE_JWKS_URL || `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
}

function apiKey(): string {
  return env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY;
}

/**
 * Verifies a Supabase access token with the project's JWKS.
 * Returns `null` for anything that is not a valid, unexpired Supabase token.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  if (!supabaseEnabled()) return null;
  try {
    jwks ??= createRemoteJWKSet(new URL(supabaseJwksUrl()));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    return toSupabaseUser(payload);
  } catch (err) {
    logger.debug({ err: err instanceof Error ? err.message : String(err) }, 'supabase token rejected');
    return null;
  }
}

function toSupabaseUser(payload: JWTPayload): SupabaseUser | null {
  const email = typeof payload.email === 'string' ? payload.email : null;
  const id = typeof payload.sub === 'string' ? payload.sub : null;
  if (!id) return null;
  const name =
    (typeof payload.user_metadata === 'object' && payload.user_metadata !== null
      ? (payload.user_metadata as Record<string, unknown>).display_name
      : null) ??
    (typeof payload.user_metadata === 'object' && payload.user_metadata !== null
      ? (payload.user_metadata as Record<string, unknown>).full_name
      : null) ??
    (typeof payload.name === 'string' ? payload.name : null) ??
    (email ? email.split('@')[0] : 'Partner');
  return { id, email: email ?? '', displayName: String(name) };
}

/**
 * Signs in with Supabase Auth (email + password).
 * Returns `null` when Supabase is not configured or the credentials are wrong.
 */
export async function supabaseSignIn(
  email: string,
  password: string,
): Promise<SupabaseSession | null> {
  if (!supabaseEnabled()) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: apiKey(),
        authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) return null;
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? '',
      expiresIn: json.expires_in ?? 3600,
    };
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'supabase sign-in failed',
    );
    return null;
  }
}

/**
 * Creates the same account in Supabase Auth (admin API).
 * Used on register so both systems stay in sync. Never throws.
 */
export async function supabaseCreateUser(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  if (!supabaseAdminEnabled()) return;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: env.SUPABASE_SECRET_KEY,
        authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: displayName } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok && res.status !== 422) {
      logger.warn({ status: res.status }, 'supabase user could not be created');
    }
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'supabase user creation failed',
    );
  }
}
