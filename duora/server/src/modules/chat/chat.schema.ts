import { z } from 'zod';

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1).max(64),
  clientMessageId: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
  type: z.enum(['TEXT', 'ATTACHMENT']).default('TEXT'),
  attachmentUrl: z.string().url().max(2000).optional(),
  attachmentMeta: z.record(z.unknown()).optional(),
  replyToId: z.string().max(64).optional(),
});

export const messagesQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(40),
});

export const syncQuerySchema = z.object({
  since: z.string().datetime(),
});

export const readSchema = z.object({
  conversationId: z.string().min(1).max(64),
  messageId: z.string().max(64).optional(),
});

export const deleteForMeSchema = z.object({
  messageId: z.string().min(1).max(64),
});

export const deleteForAllSchema = z.object({
  messageId: z.string().min(1).max(64),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
