import type { Message } from '../types/models';
import { getDatabase } from '../database/sqlite';
import { uuid } from '../utils/ids';

interface CachedRow {
  id: string;
  conversation_id: string;
  client_message_id: string;
  created_at: string;
  delivery_status: Message['deliveryStatus'];
  payload: string;
}

function rowToMessage(row: CachedRow): Message {
  const message = JSON.parse(row.payload) as Message;
  return { ...message, deliveryStatus: row.delivery_status };
}

export async function cacheMessages(messages: Message[]): Promise<void> {
  if (messages.length === 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const message of messages) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_messages
          (id, conversation_id, sender_id, client_message_id, created_at, delivery_status, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        message.id,
        message.conversationId,
        message.senderId,
        message.clientMessageId,
        message.createdAt,
        message.deliveryStatus ?? 'sent',
        JSON.stringify(message),
      );
    }
  });
}

export async function getCachedMessages(
  conversationId: string,
  limit: number,
  before?: string,
): Promise<Message[]> {
  const db = await getDatabase();
  const rows = before
    ? await db.getAllAsync<CachedRow>(
        `SELECT * FROM cached_messages
         WHERE conversation_id = ? AND created_at < ?
         ORDER BY created_at DESC LIMIT ?`,
        conversationId,
        before,
        limit,
      )
    : await db.getAllAsync<CachedRow>(
        `SELECT * FROM cached_messages
         WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`,
        conversationId,
        limit,
      );
  return rows.reverse().map(rowToMessage);
}

export async function updateDeliveryStatus(
  clientMessageId: string,
  status: NonNullable<Message['deliveryStatus']>,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE cached_messages SET delivery_status = ? WHERE client_message_id = ?',
    status,
    clientMessageId,
  );
}

export async function hideCachedMessage(messageId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM cached_messages WHERE id = ?', messageId);
}

// ── Offline outbox ────────────────────────────────────────────────

export interface OutboxEntry {
  clientMessageId: string;
  conversationId: string;
  payload: Record<string, unknown>;
  attempts: number;
  lastAttemptAt: string | null;
  createdAt: string;
}

export async function enqueueOutbox(
  conversationId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const clientMessageId = uuid();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO offline_queue (client_message_id, conversation_id, payload, attempts, created_at)
     VALUES (?, ?, ?, 0, ?)`,
    clientMessageId,
    conversationId,
    JSON.stringify({ ...payload, clientMessageId }),
    new Date().toISOString(),
  );
  return clientMessageId;
}

export async function getOutbox(): Promise<OutboxEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    client_message_id: string;
    conversation_id: string;
    payload: string;
    attempts: number;
    last_attempt_at: string | null;
    created_at: string;
  }>('SELECT * FROM offline_queue ORDER BY created_at ASC');
  return rows.map((r) => ({
    clientMessageId: r.client_message_id,
    conversationId: r.conversation_id,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    attempts: r.attempts,
    lastAttemptAt: r.last_attempt_at,
    createdAt: r.created_at,
  }));
}

export async function markOutboxAttempt(clientMessageId: string, attempts: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE offline_queue SET attempts = ?, last_attempt_at = ? WHERE client_message_id = ?',
    attempts,
    new Date().toISOString(),
    clientMessageId,
  );
}

export async function removeOutbox(clientMessageId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM offline_queue WHERE client_message_id = ?', clientMessageId);
}

// ── Drafts ────────────────────────────────────────────────────────

export async function saveDraft(conversationId: string, text: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO drafts (conversation_id, text, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(conversation_id) DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at`,
    conversationId,
    text,
    new Date().toISOString(),
  );
}

export async function loadDraft(conversationId: string): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ text: string }>(
    'SELECT text FROM drafts WHERE conversation_id = ?',
    conversationId,
  );
  return row?.text ?? '';
}

export async function clearDraft(conversationId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM drafts WHERE conversation_id = ?', conversationId);
}

// ── Sync watermarks ───────────────────────────────────────────────

export async function getSyncWatermark(conversationId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    `sync:${conversationId}`,
  );
  return row?.value ?? null;
}

export async function setSyncWatermark(conversationId: string, iso: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    `sync:${conversationId}`,
    iso,
  );
}
