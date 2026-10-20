import * as SQLite from 'expo-sqlite';
import { logger } from '../utils/logger';

const DB_NAME = 'duora.db';
const CURRENT_VERSION = 2;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (once) and migrates the local SQLite cache. Durable truth stays on the
 * server; SQLite holds cached messages, the offline outbox and drafts.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_messages (
        id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        client_message_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        delivery_status TEXT NOT NULL DEFAULT 'sent',
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_conv_time
        ON cached_messages(conversation_id, created_at);

      CREATE TABLE IF NOT EXISTS offline_queue (
        client_message_id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS drafts (
        conversation_id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 1;`);
  }

  if (version < 2) {
    // Local-only saved memories (a client feature; no server table required).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        saved_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_saved ON memories(saved_at DESC);
      PRAGMA user_version = ${CURRENT_VERSION};
    `);
    logger.info('sqlite', 'migrated to version 2 (memories)');
  }
  return db;
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS cached_messages;
    DROP TABLE IF EXISTS offline_queue;
    DROP TABLE IF EXISTS drafts;
    DROP TABLE IF EXISTS sync_meta;
    DROP TABLE IF EXISTS memories;
  `);
  dbPromise = null;
  await openAndMigrate();
}
