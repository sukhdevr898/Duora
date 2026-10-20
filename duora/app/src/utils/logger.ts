import { config } from '../constants/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const REDACT_KEYS = ['password', 'token', 'accessToken', 'refreshToken', 'pushToken', 'sdp', 'candidate'];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        REDACT_KEYS.some((r) => k.toLowerCase().includes(r.toLowerCase())) ? '[redacted]' : redact(v),
      ]),
    );
  }
  return value;
}

function write(level: LogLevel, scope: string, message: string, meta?: unknown): void {
  if (config.env === 'production' && level === 'debug') return;
  const line = `[${level.toUpperCase()}] ${scope}: ${message}`;
  const args = meta === undefined ? [line] : [line, redact(meta)];
  if (level === 'error') console.error(...args);
  else if (level === 'warn') console.warn(...args);
  else console.log(...args);
}

export const logger = {
  debug: (scope: string, message: string, meta?: unknown) => write('debug', scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) => write('info', scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) => write('warn', scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) => write('error', scope, message, meta),
};
