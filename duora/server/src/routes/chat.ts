/** Conversations, messages, receipts, reactions and quick replies. */
import { z } from 'zod';
import { db } from '../db';
import { ApiError, id, nowIso, asyncHandler } from '../util';
import { conversationIdFor, partnerOf } from './pairing';
import { findById } from './users';
import { Router } from 'express';
import { requireAuth } from '../auth';
import { validate, validatedQuery } from '../http';

export const sendMessageSchema = z.object({
  clientMessageId: z.string().min(4).max(80),
  text: z.string().max(4000).default(''),
  sticker: z.string().max(40).nullable().optional(),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(60),
});

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_message_id: string;
  type: string;
  text: string;
  sticker_id: string | null;
  attachment_url: string | null;
  reply_to_id: string | null;
  deleted_for_all_at: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  clientMessageId: string;
  conversationId: string;
  from: 'me' | 'partner';
  text: string;
  sticker: string | null;
  type: string;
  createdAt: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  reactions: string[];
};

export type ConversationSummary = {
  id: string;
  partner: {
    id: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
    online: boolean;
    lastSeenAt: string | null;
  } | null;
  lastMessage: {
    text: string;
    sticker: string | null;
    createdAt: string;
    from: 'me' | 'partner';
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const rows = await db().all<{
    id: string;
    updated_at: string;
    partner_id: string | null;
    display_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    online: number | null;
    last_seen_at: string | null;
    last_text: string | null;
    last_sticker: string | null;
    last_created_at: string | null;
    last_sender: string | null;
    unread: number | null;
  }>(
    `SELECT c.id,
            c.updated_at,
            p.id            AS partner_id,
            p.display_name  AS display_name,
            me.partner_nickname AS nickname,
            p.avatar_url    AS avatar_url,
            pr.online       AS online,
            pr.last_seen_at AS last_seen_at,
            lm.text         AS last_text,
            lm.sticker_id   AS last_sticker,
            lm.created_at   AS last_created_at,
            lm.sender_id    AS last_sender,
            (SELECT COUNT(*) FROM messages m2
               WHERE m2.conversation_id = c.id
                 AND m2.sender_id <> ?
                 AND m2.created_at > COALESCE(
                   (SELECT MAX(r.read_at) FROM message_receipts r
                     WHERE r.user_id = ? AND r.message_id IN (
                       SELECT id FROM messages WHERE conversation_id = c.id)), '1970-01-01')
             ) AS unread
       FROM conversations c
       LEFT JOIN pairings prg ON prg.id = c.pairing_id
       LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ?
       LEFT JOIN users p ON p.id = (SELECT user_id FROM conversation_participants
                                      WHERE conversation_id = c.id AND user_id <> ? LIMIT 1)
       LEFT JOIN users me ON me.id = ?
       LEFT JOIN presence pr ON pr.user_id = p.id
       LEFT JOIN messages lm ON lm.id = (SELECT id FROM messages WHERE conversation_id = c.id
                                          ORDER BY created_at DESC LIMIT 1)
      WHERE cp.user_id = ? AND prg.status = 'ACTIVE'
      ORDER BY c.updated_at DESC`,
    [userId, userId, userId, userId, userId, userId],
  );

  return rows.map((row) => ({
    id: row.id,
    partner: row.partner_id
      ? {
          id: row.partner_id,
          displayName: row.display_name ?? 'Partner',
          nickname: row.nickname,
          avatarUrl: row.avatar_url,
          online: Boolean(row.online),
          lastSeenAt: row.last_seen_at ?? null,
        }
      : null,
    lastMessage: row.last_created_at
      ? {
          text: row.last_text ?? '',
          sticker: row.last_sticker,
          createdAt: row.last_created_at,
          from: row.last_sender === userId ? 'me' : 'partner',
        }
      : null,
    unreadCount: Number(row.unread ?? 0),
    updatedAt: row.updated_at,
  }));
}

export async function listMessages(
  userId: string,
  conversationId: string,
  limit = 60,
): Promise<ChatMessage[]> {
  await assertMember(userId, conversationId);
  const rows = await db().all<MessageRow>(
    `SELECT * FROM messages
     WHERE conversation_id = ? AND deleted_for_all_at IS NULL
     ORDER BY created_at DESC LIMIT ?`,
    [conversationId, limit],
  );
  const messages = rows.reverse();
  if (messages.length === 0) return [];

  const ids = messages.map((m) => m.id);
  const placeholders = ids.map(() => '?').join(',');
  const receiptRows = await db().all<{ message_id: string; user_id: string; read_at: string | null; delivered_at: string | null }>(
    `SELECT message_id, user_id, read_at, delivered_at FROM message_receipts WHERE message_id IN (${placeholders})`,
    ids,
  );
  const reactionRows = await db().all<{ message_id: string; emoji: string }>(
    `SELECT message_id, emoji FROM reactions WHERE message_id IN (${placeholders})`,
    ids,
  );

  const receiptMap = new Map<string, { read: boolean; delivered: boolean }>();
  for (const r of receiptRows) {
    const current = receiptMap.get(r.message_id) ?? { read: false, delivered: false };
    if (r.read_at) current.read = true;
    if (r.delivered_at) current.delivered = true;
    receiptMap.set(r.message_id, current);
  }

  const reactionMap = new Map<string, string[]>();
  for (const r of reactionRows) {
    const list = reactionMap.get(r.message_id) ?? [];
    list.push(r.emoji);
    reactionMap.set(r.message_id, list);
  }

  return messages.map((m) => {
    const receipt = receiptMap.get(m.id);
    const fromPartner = m.sender_id !== userId;
    const status: ChatMessage['status'] = fromPartner
      ? 'delivered'
      : receipt?.read
        ? 'read'
        : receipt?.delivered
          ? 'delivered'
          : 'sent';
    return {
      id: m.id,
      clientMessageId: m.client_message_id,
      conversationId: m.conversation_id,
      from: fromPartner ? 'partner' : 'me',
      text: m.text,
      sticker: m.sticker_id,
      type: m.type,
      createdAt: m.created_at,
      time: formatTime(m.created_at),
      status,
      reactions: reactionMap.get(m.id) ?? [],
    };
  });
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  input: { clientMessageId: string; text: string; sticker?: string | null },
): Promise<ChatMessage> {
  await assertMember(userId, conversationId);
  const text = input.text.trim();
  if (!text && !input.sticker) throw ApiError.badRequest('A message needs text or a sticker');

  const existing = await db().one<MessageRow>(
    'SELECT * FROM messages WHERE conversation_id = ? AND client_message_id = ?',
    [conversationId, input.clientMessageId],
  );
  if (existing) {
    const [mapped] = await listMessages(userId, conversationId, 1);
    return mapped;
  }

  const messageId = id('msg');
  const now = nowIso();
  await db().run(
    `INSERT INTO messages
       (id, conversation_id, sender_id, client_message_id, type, text, sticker_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      messageId,
      conversationId,
      userId,
      input.clientMessageId,
      input.sticker ? 'STICKER' : 'TEXT',
      text,
      input.sticker ?? null,
      now,
    ],
  );
  await db().run(
    `INSERT INTO message_receipts (message_id, user_id, delivered_at) VALUES (?, ?, ?)`,
    [messageId, userId, now],
  );
  await db().run('UPDATE conversations SET updated_at = ? WHERE id = ?', [now, conversationId]);

  return {
    id: messageId,
    clientMessageId: input.clientMessageId,
    conversationId,
    from: 'me',
    text,
    sticker: input.sticker ?? null,
    type: input.sticker ? 'STICKER' : 'TEXT',
    createdAt: now,
    time: formatTime(now),
    status: 'sent',
    reactions: [],
  };
}

/** Marks the partner's messages as read for this user. */
export async function markRead(userId: string, conversationId: string): Promise<number> {
  await assertMember(userId, conversationId);
  const rows = await db().all<{ id: string }>(
    `SELECT id FROM messages WHERE conversation_id = ? AND sender_id <> ? AND deleted_for_all_at IS NULL`,
    [conversationId, userId],
  );
  const now = nowIso();
  for (const row of rows) {
    await db().run(
      `INSERT INTO message_receipts (message_id, user_id, delivered_at, read_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(message_id, user_id) DO UPDATE SET read_at = COALESCE(message_receipts.read_at, ?)`,
      [row.id, userId, now, now, now],
    );
  }
  return rows.length;
}

export async function toggleReaction(
  userId: string,
  messageId: string,
  emoji: string,
): Promise<string[]> {
  const message = await db().one<MessageRow>('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (!message) throw ApiError.notFound('Message not found');
  await assertMember(userId, message.conversation_id);

  const existing = await db().one(
    'SELECT 1 AS x FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
    [messageId, userId, emoji],
  );
  if (existing) {
    await db().run('DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?', [
      messageId,
      userId,
      emoji,
    ]);
  } else {
    await db().run(
      'INSERT INTO reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)',
      [messageId, userId, emoji, nowIso()],
    );
  }
  const rows = await db().all<{ emoji: string }>(
    'SELECT emoji FROM reactions WHERE message_id = ? ORDER BY created_at',
    [messageId],
  );
  return rows.map((r) => r.emoji);
}

export async function hideMessage(userId: string, messageId: string): Promise<void> {
  const message = await db().one<MessageRow>('SELECT * FROM messages WHERE id = ?', [messageId]);
  if (!message) throw ApiError.notFound('Message not found');
  await assertMember(userId, message.conversation_id);
  await db().run(
    'INSERT INTO hidden_messages (message_id, user_id, hidden_at) VALUES (?, ?, ?)',
    [messageId, userId, nowIso()],
  );
}

export async function assertMember(userId: string, conversationId: string): Promise<void> {
  const row = await db().one(
    'SELECT 1 AS x FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
  );
  if (!row) throw ApiError.forbidden('You are not part of this conversation');
}

/** Convenience for the app: resolves the caller's conversation automatically. */
export async function myConversationId(userId: string): Promise<string | null> {
  return conversationIdFor(userId);
}

export async function partnerName(userId: string): Promise<string> {
  const partner = await partnerOf(userId);
  if (!partner) return 'Partner';
  const me = await findById(userId);
  return me?.partner_nickname ?? partner.partner_nickname ?? partner.display_name;
}

function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
    .replace(/\s/g, ' ')
    .replace(/^0/, '');
}

export const chatRouter = Router();
chatRouter.use(requireAuth);

chatRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    res.json({ conversations: await listConversations(req.user!.id) });
  }),
);

chatRouter.get(
  '/conversations/:conversationId/messages',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { limit } = validatedQuery<{ limit: number }>(req);
    const messages = await listMessages(req.user!.id, req.params.conversationId, limit);
    res.json({ messages });
  }),
);

chatRouter.post(
  '/conversations/:conversationId/messages',
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { clientMessageId: string; text: string; sticker?: string | null };
    const message = await sendMessage(req.user!.id, req.params.conversationId, body);
    res.status(201).json({ message });
  }),
);

chatRouter.post(
  '/conversations/:conversationId/read',
  asyncHandler(async (req, res) => {
    const count = await markRead(req.user!.id, req.params.conversationId);
    res.json({ marked: count });
  }),
);

chatRouter.post(
  '/messages/:messageId/reactions',
  validate(reactionSchema),
  asyncHandler(async (req, res) => {
    const { emoji } = req.body as { emoji: string };
    const reactions = await toggleReaction(req.user!.id, req.params.messageId, emoji);
    res.json({ reactions });
  }),
);

chatRouter.delete(
  '/messages/:messageId',
  asyncHandler(async (req, res) => {
    await hideMessage(req.user!.id, req.params.messageId);
    res.status(204).send();
  }),
);

/** Quick-reply suggestions the composer shows. */
chatRouter.get(
  '/quick-replies',
  asyncHandler(async (_req, res) => {
    res.json({
      replies: [
        'Miss you ✨',
        'Call me 💖',
        '❤️',
        'Good night 🌙',
        'Love you 💜',
      ],
    });
  }),
);

chatRouter.get(
  '/partner',
  asyncHandler(async (req, res) => {
    const conversationId = await myConversationId(req.user!.id);
    if (!conversationId) throw ApiError.notFound('You are not paired yet');
    res.json({ conversationId, partnerName: await partnerName(req.user!.id) });
  }),
);
