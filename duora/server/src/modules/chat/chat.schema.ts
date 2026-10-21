import { z } from 'zod';

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
