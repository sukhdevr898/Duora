import express from 'express';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { appRouter } from './modules/app/app.routes';
import { callsRouter } from './modules/calls/calls.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { devicesRouter } from './modules/devices/devices.routes';
import { notesRouter } from './modules/notes/notes.routes';
import { pairingRouter } from './modules/pairing/pairing.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { usersRouter } from './modules/users/users.routes';
import { healthPayload } from './modules/health/health.service';

export function createApp(): express.Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      // The mobile client talks to this API over plain HTTP in development.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  );

  /* ---------------- health ---------------- */
  app.get('/health', async (_req, res) => {
    const payload = await healthPayload();
    res.status(payload.status === 'down' ? 503 : 200).json({
      status: payload.status,
      uptimeSeconds: payload.uptimeSeconds,
      version: payload.version,
      latencyMs: payload.latencyMs,
      services: payload.services,
    });
  });

  app.get('/api/v1/health', async (_req, res) => {
    res.json(await healthPayload());
  });

  /* ---------------- static media ---------------- */
  // Avatars and memory photos are served by the API so the mobile client
  // never depends on a third-party CDN.
  app.use(
    '/img',
    express.static(path.join(process.cwd(), 'public', 'img'), {
      maxAge: '7d',
      fallthrough: true,
    }),
  );

  /* ---------------- api ---------------- */
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/pairing', pairingRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/calls', callsRouter);
  app.use('/api/v1/notes', notesRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/devices', devicesRouter);
  app.use('/api/v1', appRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
