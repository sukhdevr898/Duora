import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as chatService from './chat.service';
import type { SendMessageInput } from './chat.schema';

export const listConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ conversations: await chatService.listConversations(req.user!.id) });
});

export const sendMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.sendMessage(req.user!.id, req.body as SendMessageInput);
  res.status(201).json({ message });
});

export const getMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const query = req.query as unknown as { cursor?: string; limit: number };
  const result = await chatService.getMessages(req.user!.id, id, {
    cursor: query.cursor,
    limit: Number(query.limit),
  });
  res.json(result);
});

export const syncHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { since } = req.query as { since: string };
  const result = await chatService.syncSince(req.user!.id, id, new Date(since));
  res.json(result);
});

export const deliveredHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const count = await chatService.markDelivered(req.user!.id, id);
  res.json({ delivered: count });
});

export const readHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatService.markRead(req.user!.id, req.body.conversationId, req.body.messageId);
  res.json(result);
});

export const deleteForMeHandler = asyncHandler(async (req: Request, res: Response) => {
  await chatService.deleteForMe(req.user!.id, req.body.messageId);
  res.status(204).end();
});

export const deleteForAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatService.deleteForEveryone(req.user!.id, req.body.messageId);
  res.json(result);
});
