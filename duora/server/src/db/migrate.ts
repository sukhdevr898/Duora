/**
 * Creates the schema. Safe to run on every boot — every statement is
 * `IF NOT EXISTS`. `npm run db:reset` drops the SQLite file first.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { db } from './client';

export async function migrate(): Promise<void> {
  const file = env.isPostgres ? 'schema.postgres.sql' : 'schema.sqlite.sql';
  const sql = readFileSync(join(__dirname, file), 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    await db().exec(statement);
  }
  logger.info({ driver: env.isPostgres ? 'postgres' : 'sqlite', statements: statements.length }, 'schema ready');
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'migration failed');
      process.exit(1);
    });
}
