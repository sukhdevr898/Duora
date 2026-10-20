import pino from 'pino';
import { env } from './env';

// Privacy-safe structured logger. Redaction paths keep secrets/tokens out of logs.
// Personal lightweight: in production default to 'warn' unless LOG_LEVEL explicitly set,
// saving log I/O on Render free tier. Locally stays at 'info'.
export const logger = pino({
  level: env.LOG_LEVEL === 'info' && env.isProd ? 'warn' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.pushToken',
      '*.sdp',
      '*.candidate',
    ],
    censor: '[redacted]',
  },
  transport:
    env.isProd || env.isTest
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
});
