/** Environment configuration and the logger. */
import { z } from 'zod';
import 'dotenv/config';
import pino from 'pino';

/**
 * Environment configuration. Every value is validated once at boot so a
 * misconfigured Render service fails loudly instead of at the first request.
 */

const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),

  /**
   * The one value that matters:
   *   postgresql://…  → Supabase Postgres (production on Render)
   *   file:./data/…   → embedded SQLite (local development)
   */
  DATABASE_URL: z.string().default('file:./data/duora.db'),

  /** How often to retry the database connection while it wakes up. */
  DB_CONNECT_ATTEMPTS: z.coerce.number().int().positive().default(12),
  DB_CONNECT_DELAY_MS: z.coerce.number().int().positive().default(5000),
  /** `sqlite` lets the server boot with a local file if Postgres is unreachable. */
  DB_FALLBACK: z.enum(['none', 'sqlite']).default('none'),

  JWT_ACCESS_SECRET: z.string().min(16).default('duora-dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('duora-dev-refresh-secret-change-me'),
  ACCESS_TTL: z.string().default('30d'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /**
   * Supabase (optional). With `SUPABASE_URL` set the API can also use
   * Supabase Auth: sign-in fallback and access-token verification (JWKS).
   */
  SUPABASE_URL: z.string().default(''),
  SUPABASE_PUBLISHABLE_KEY: z.string().default(''),
  SUPABASE_SECRET_KEY: z.string().default(''),
  SUPABASE_JWKS_URL: z.string().default(''),

  CORS_ORIGINS: z.string().default(''),
  PUBLIC_BASE_URL: z.string().default(''),
  LOG_LEVEL: z.string().default('info'),
  APP_VERSION: z.string().default('3.0.0'),
  REGION: z.string().default('Singapore · ap-southeast'),
  PAIRING_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  SEED_ON_BOOT: bool(false),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isPostgres: raw.DATABASE_URL.startsWith('postgres://') || raw.DATABASE_URL.startsWith('postgresql://'),
  supabaseUrl: raw.SUPABASE_URL.replace(/\/$/, ''),
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  logLevel: raw.LOG_LEVEL as 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
};

export const logger = pino({
  level: env.isProd ? env.logLevel : 'info',
  base: { service: 'duora-server' },
  transport: env.isProd
    ? undefined
    : { target: 'pino/file', options: { destination: 1 } },
});
