import { getDatabase } from '../database/sqlite';
import { uuid } from '../utils/ids';
import type { Message } from '../types/models';

export interface Memory {
  id: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  savedAt: string;
}

interface MemoryRow {
  id: string;
  message_id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  saved_at: string;
}

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    messageId: row.message_id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    createdAt: row.created_at,
    savedAt: row.saved_at,
  };
}

export async function saveMemory(message: Message): Promise<Memory> {
  const db = await getDatabase();
  const memory: Memory = {
    id: uuid(),
    messageId: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    text: message.text,
    createdAt: message.createdAt,
    savedAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT OR IGNORE INTO memories
      (id, message_id, conversation_id, sender_id, text, created_at, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    memory.id,
    memory.messageId,
    memory.conversationId,
    memory.senderId,
    memory.text,
    memory.createdAt,
    memory.savedAt,
  );
  return memory;
}

export async function listMemories(): Promise<Memory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MemoryRow>('SELECT * FROM memories ORDER BY saved_at DESC');
  return rows.map(rowToMemory);
}

export async function deleteMemory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM memories WHERE id = ?', id);
}
