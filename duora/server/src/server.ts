import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectPrisma, disconnectPrisma, prisma } from './database/prisma';
import { createSocketServer } from './websocket/socket';
import { startCleanupJobs, stopCleanupJobs } from './jobs/cleanup.job';

async function bootstrap(): Promise<void> {
  await connectPrisma();
  logger.info('Database connection established');

  const app = createApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);
  const cleanupTimer = startCleanupJobs();

  // Render requires binding to 0.0.0.0 + env.PORT (10000 on free tier)
  const server = httpServer.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`Duora server listening on 0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });

  // Lightweight keep-alive tuning for Render free tier (prevents idle disconnects)
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 70_000;

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down gracefully');
    stopCleanupJobs(cleanupTimer);
    io.close();
    server.close(() => {
      void disconnectPrisma().finally(() => process.exit(0));
    });
    // Hard exit if cleanup stalls
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled promise rejection'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  void prisma.$disconnect().finally(() => process.exit(1));
});
