/** Boot: wait for the database, migrate, seed, listen. */
import { createServer } from 'node:http';
import { env, logger } from './env';
import { createApp } from './app';
import { db, migrate, useSqliteFallback, waitForDatabase } from './db';
import { createSocketServer } from './realtime';
import { seed } from './seed';

async function main(): Promise<void> {
  try {
    await waitForDatabase();
  } catch (err) {
    if (env.DB_FALLBACK === 'sqlite') {
      useSqliteFallback();
    } else {
      logger.error({ err }, 'startup failed');
      process.exit(1);
    }
  }

  await migrate();

  if (env.SEED_ON_BOOT) {
    await seed({ quiet: true });
  }

  const app = createApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  httpServer.listen(env.PORT, env.HOST, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        driver: db().dialect,
        realtime: 'socket.io',
      },
      `Duora server ready → http://${env.HOST}:${env.PORT}`,
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    io.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main().catch((err) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
