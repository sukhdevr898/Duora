import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.isProd ? env.logLevel : 'info',
  base: { service: 'duora-server' },
  transport: env.isProd
    ? undefined
    : { target: 'pino/file', options: { destination: 1 } },
});
