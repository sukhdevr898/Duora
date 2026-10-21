import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate, validatedQuery } from '../../middleware/validate.middleware';
import { ApiError } from '../../utils/ApiError';
import * as chat from './chat.service';
import { listQuerySchema, reactionSchema, sendMessageSchema } from './chat.schema';

export const chatRouter = Router();
chatRouter.use(requireAuth);

chatRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    res.json({ conversations: await chat.listConversations(req.user!.id) });
  }),
);

chatRouter.get(
  '/conversations/:conversationId/messages',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { limit } = validatedQuery<{ limit: number }>(req);
    const messages = await chat.listMessages(req.user!.id, req.params.conversationId, limit);
    res.json({ messages });
  }),
);

chatRouter.post(
  '/conversations/:conversationId/messages',
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { clientMessageId: string; text: string; sticker?: string | null };
    const message = await chat.sendMessage(req.user!.id, req.params.conversationId, body);
    res.status(201).json({ message });
  }),
);

chatRouter.post(
  '/conversations/:conversationId/read',
  asyncHandler(async (req, res) => {
    const count = await chat.markRead(req.user!.id, req.params.conversationId);
    res.json({ marked: count });
  }),
);

chatRouter.post(
  '/messages/:messageId/reactions',
  validate(reactionSchema),
  asyncHandler(async (req, res) => {
    const { emoji } = req.body as { emoji: string };
    const reactions = await chat.toggleReaction(req.user!.id, req.params.messageId, emoji);
    res.json({ reactions });
  }),
);

chatRouter.delete(
  '/messages/:messageId',
  asyncHandler(async (req, res) => {
    await chat.hideMessage(req.user!.id, req.params.messageId);
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
    const conversationId = await chat.myConversationId(req.user!.id);
    if (!conversationId) throw ApiError.notFound('You are not paired yet');
    res.json({ conversationId, partnerName: await chat.partnerName(req.user!.id) });
  }),
);
