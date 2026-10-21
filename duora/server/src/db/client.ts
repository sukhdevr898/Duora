/**
 * Tiny portable data layer.
 *
 * Duora must run in two places:
 *   • locally / single-instance  → embedded SQLite (node:sqlite, zero native deps)
 *   • on Render with a managed DB → Postgres (pg)
 *
 * Both drivers speak the same `query(sql, params)` contract with `?`
 * placeholders; the Postgres driver rewrites them to `$1..$n`.
 */
import { DatabaseSync } from 'node:sqlite';
import { Pool, type PoolClient } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

export type Row = Record<string, unknown>;

export interface Db {
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
  close(): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* SQLite driver                                                      */
/* ------------------------------------------------------------------ */
class SqliteDb implements Db {
  private readonly db: DatabaseSync;

  constructor(file: string) {
    if (file !== ':memory:') {
      const dir = file.split('/').slice(0, -1).join('/');
      if (dir && dir !== '.') {
        // Lazily create the directory without pulling in fs at module scope.
        require('node:fs').mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params as never[])) as T[];
  }

  async one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...(params as never[]));
    return (row as T) ?? null;
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...(params as never[]));
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

  async close(): Promise<void> {
    this.db.close();
  }
}

/* ------------------------------------------------------------------ */
/* Postgres driver                                                    */
/* ------------------------------------------------------------------ */
class PostgresDb implements Db {
  private readonly pool: Pool;

  constructor(url: string) {
    this.pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
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

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let instance: Db | null = null;

export function db(): Db {
  if (!instance) {
    instance = env.isPostgres
      ? new PostgresDb(env.DATABASE_URL)
      : new SqliteDb(env.DATABASE_URL.replace(/^file:/, ''));
    logger.info(
      { driver: env.isPostgres ? 'postgres' : 'sqlite' },
      'database connection ready',
    );
  }
  return instance;
}

export function setDb(next: Db): void {
  instance = next;
}
