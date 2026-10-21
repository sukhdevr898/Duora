import { createServer } from 'node:http';
import { env } from './config/env';
import { logger } from './config/logger';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { createSocketServer } from './websocket/socket';
import { seed } from './seed';

async function main(): Promise<void> {
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
        driver: env.isPostgres ? 'postgres' : 'sqlite',
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

main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.stack : String(err) }, 'server failed to start');
  process.exit(1);
});
