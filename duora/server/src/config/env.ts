import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const numeric = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : Number(v)));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: numeric(4000),
  DATABASE_URL: z.string().min(1),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: numeric(30),
  INVITATION_TTL_MINUTES: numeric(10),
  INVITATION_MAX_ATTEMPTS: numeric(5),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional().default(''),
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(''),
  TURN_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  TURN_SECRET: z.string().optional().default(''),
  TURN_TTL_SECONDS: numeric(3600),
  STUN_URLS: z.string().default('stun:stun.l.google.com:19302'),
  TURN_URLS: z.string().default(''),
  ATTACHMENTS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  ATTACHMENT_MAX_BYT: numeric(10 * 1024 * 1024),
  ATTACHMENT_DIR: z.string().default('./data/attachments'),
  ANDROID_LATEST_VERSION: z.string().default('1.0.0'),
  ANDROID_MIN_SUPPORTED_VERSION: z.string().default('1.0.0'),
  ANDROID_RELEASE_URL: z.string().url().default('https://play.google.com/store/apps/details?id=com.duora.app'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with readable messages; never print the values of secrets.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid server environment configuration:\n${issues}`);
}

const data = parsed.data;

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  corsOrigins: data.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  stunUrls: data.STUN_URLS.split(',').map((s) => s.trim()).filter(Boolean),
  turnUrls: data.TURN_URLS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  firebaseConfigured:
    Boolean(data.FIREBASE_SERVICE_ACCOUNT_PATH) ||
    (Boolean(data.FIREBASE_PROJECT_ID) && Boolean(data.FIREBASE_CLIENT_EMAIL) && Boolean(data.FIREBASE_PRIVATE_KEY)),
};

export type Env = typeof env;
