/**
 * Database access — Supabase Postgres in production, embedded SQLite locally.
 *
 * One small data layer with two drivers. The same SQL runs on both, so the
 * app never has to care where the data lives:
 *   • production → `DATABASE_URL=postgresql://…` (Supabase connection string)
 *   • local dev  → `DATABASE_URL=file:./data/duora.db`
 */
import { DatabaseSync } from 'node:sqlite';
import { Pool, type PoolClient } from 'pg';
import { env, logger } from './env';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Row = Record<string, unknown>;

export interface Db {
  /** Which driver is in use. */
  readonly dialect: 'postgres' | 'sqlite';
  /** Returns every matching row. */
  all<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Returns the first matching row or null. */
  one<T = Row>(sql: string, params?: unknown[]): Promise<T | null>;
  /** Runs a write statement. */
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  /** Runs raw DDL / multi-statement SQL. */
  exec(sql: string): Promise<void>;
  /** Runs `fn` inside a transaction. */
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  /** Checks that the database answers. */
  ping(): Promise<void>;
  close(): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* SQLite driver — local development and offline fallback               */
/* ------------------------------------------------------------------ */
class SqliteDb implements Db {
  readonly dialect = 'sqlite' as const;
  private readonly db: DatabaseSync;

  constructor(file: string) {
    if (file !== ':memory:') {
      const dir = file.split('/').slice(0, -1).join('/');
      if (dir && dir !== '.') {
        require('node:fs').mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }

  async one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...(params as never[])) as T) ?? null;
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const info = this.db.prepare(sql).run(...(params as never[]));
    return { changes: Number(info.changes ?? 0) };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN');
    try {
      const out = await fn(this);
      this.db.exec('COMMIT');
      return out;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  async ping(): Promise<void> {
    this.db.prepare('SELECT 1').get();
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

/* ------------------------------------------------------------------ */
/* Postgres driver — Supabase                                          */
/* ------------------------------------------------------------------ */
class PostgresDb implements Db {
  readonly dialect = 'postgres' as const;
  private readonly pool: Pool;

  constructor(url: string) {
    this.pool = new Pool({
      connectionString: url,
      // Supabase's free tier allows a handful of connections — keep the pool small.
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
      // Supabase's pooler is used in session mode (port 5432) by default, so a
      // connection keeps its session for as long as the pool holds it.
      // Supabase requires TLS. `sslmode=require` in the URL enables it.
      ssl: url.includes('sslmode=require') || url.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  /** Rewrites `?` placeholders into `$1, $2, …` for Postgres. */
  private static toPg(sql: string): string {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  async all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.pool.query(PostgresDb.toPg(sql), params);
    return res.rows as T[];
  }

  async one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    const res = await this.pool.query(PostgresDb.toPg(sql), params);
    return (res.rows[0] as T) ?? null;
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const res = await this.pool.query(PostgresDb.toPg(sql), params);
    return { changes: res.rowCount ?? 0 };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    const tx: Db = {
      dialect: 'postgres',
      all: async (sql, params) => (await client.query(PostgresDb.toPg(sql), params)).rows,
      one: async (sql, params) => {
        const res = await client.query(PostgresDb.toPg(sql), params);
        return res.rows[0] ?? null;
      },
      run: async (sql, params) => {
        const res = await client.query(PostgresDb.toPg(sql), params);
        return { changes: res.rowCount ?? 0 };
      },
      exec: async (sql) => {
        await client.query(sql);
      },
      transaction: async () => {
        throw new Error('nested transactions are not supported');
      },
      ping: async () => {
        await client.query('SELECT 1');
      },
      close: async () => undefined,
    };
    await client.query('BEGIN');
    try {
      const out = await fn(tx);
      await client.query('COMMIT');
      return out;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let instance: Db | null = null;

/** The active database connection (created on first use). */
export function db(): Db {
  if (!instance) {
    instance = env.isPostgres
      ? new PostgresDb(env.DATABASE_URL)
      : new SqliteDb(env.DATABASE_URL.replace(/^file:/, ''));
  }
  return instance;
}

export function setDb(next: Db): void {
  instance = next;
}

/** Host / port / database of the configured URL — never the password. */
export function databaseTarget(): string {
  if (!env.isPostgres) return env.DATABASE_URL;
  try {
    const url = new URL(env.DATABASE_URL);
    return `${url.hostname}:${url.port || 5432}/${url.pathname.replace(/^\//, '') || 'postgres'}`;
  } catch {
    return 'unknown';
  }
}

/**
 * Waits for the database to accept connections.
 *
 * Render and Supabase both need a moment after a cold start, and the Supabase
 * pooler occasionally refuses the first connections while it wakes up. This
 * retries a few times and then explains exactly what to check.
 */
export async function waitForDatabase(
  attempts = env.DB_CONNECT_ATTEMPTS,
  delayMs = env.DB_CONNECT_DELAY_MS,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await db().ping();
      logger.info(
        { driver: db().dialect, target: databaseTarget(), attempt },
        'database connection ready',
      );
      return;
    } catch (err) {
      lastError = err;
      logger.warn(
        { attempt, attempts, err: err instanceof Error ? err.message : String(err) },
        'database not ready yet',
      );
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  logger.error({ err: detail, target: databaseTarget() }, 'database connection failed');
  throw new Error(
    [
      `Could not reach the database at ${databaseTarget()}.`,
      'Checklist:',
      '  1. The DATABASE_URL is a complete, correct Supabase connection string.',
      '  2. The Supabase project is active (not paused) in the Supabase dashboard.',
      '  3. The database password is correct (Supabase → Settings → Database → reset password).',
      '  4. Use the pooled host …pooler.supabase.com (Render has no IPv6).',
      `Original error: ${detail}`,
    ].join('\n'),
  );
}

/** Falls back to a local SQLite file — handy when Supabase is briefly down. */
export function useSqliteFallback(): void {
  if (env.isPostgres) {
    logger.warn('falling back to the local SQLite database');
    instance = new SqliteDb(env.DATABASE_URL.replace(/^file:/, '') || './data/duora.db');
  }
}

/* ------------------------------------------------------------------ */
/* Migration                                                           */
/* ------------------------------------------------------------------ */

/**
 * Creates the schema. Safe to run on every boot — every statement is
 * `IF NOT EXISTS`.
 */
export async function migrate(): Promise<void> {
  const file = db().dialect === 'postgres' ? 'schema.sql' : 'schema.sqlite.sql';
  const sql = readFileSync(join(__dirname, file), 'utf8');
  const statements = splitStatements(sql);

  for (const statement of statements) {
    await db().exec(statement);
  }
  logger.info(
    { driver: db().dialect, statements: statements.length },
    'schema ready',
  );
}

/** Splits a SQL file into single statements, dropping `--` comment lines. */
function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((chunk) =>
      chunk
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((chunk) => chunk.length > 0);
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'migration failed');
      process.exit(1);
    });
}
