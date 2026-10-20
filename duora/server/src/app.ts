import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { healthRouter, appRouter } from './modules/app/app.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import pairingRoutes from './modules/pairing/pairing.routes';
import chatRoutes from './modules/chat/chat.routes';
import callsRoutes from './modules/calls/calls.routes';
import devicesRoutes from './modules/devices/devices.routes';

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser clients (no origin) and configured origins.
        if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  // Lightweight logging: skip /health + /ready, reduce verbosity on Render free tier.
  // Logs are still structured (pino) but health noise doesn't wake up log drains.
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/ready' },
      quietReqLogger: env.isProd,
    }),
  );
  app.use(globalLimiter);

  app.use(healthRouter);

  const api = express.Router();
  api.use('/auth', authRoutes);
  api.use('/users', usersRoutes);
  api.use('/pairing', pairingRoutes);
  api.use('/', chatRoutes);
  api.use('/', callsRoutes);
  api.use('/devices', devicesRoutes);
  api.use('/', appRouter);
  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
