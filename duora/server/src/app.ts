/** The Express app: middleware, static media and the route table. */
import express from 'express';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env, logger } from './env';
import { errorHandler, notFoundHandler } from './http';
import { authRouter } from './routes/auth';
import { appRouter, healthPayload } from './routes/system';
import { callsRouter } from './routes/calls';
import { chatRouter } from './routes/chat';
import { devicesRouter } from './routes/devices';
import { notesRouter } from './routes/notes';
import { pairingRouter } from './routes/pairing';
import { settingsRouter } from './routes/settings';
import { usersRouter } from './routes/users';

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
