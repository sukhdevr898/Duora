import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate, validatedQuery } from '../../middleware/validate.middleware';
import * as calls from './calls.service';

const startSchema = z.object({ kind: z.enum(['voice', 'video']).default('voice') });
const endSchema = z.object({
  outcome: z.enum(['ENDED', 'DECLINED', 'CANCELLED', 'MISSED', 'FAILED']).default('ENDED'),
});
const listSchema = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

export const callsRouter = Router();
callsRouter.use(requireAuth);

callsRouter.get(
  '/',
  validate(listSchema, 'query'),
  asyncHandler(async (req, res) => {
    const limit = validatedQuery<{ limit: number }>(req)?.limit ?? 50;
    res.json({ calls: await calls.listCalls(req.user!.id, limit) });
  }),
);

callsRouter.post(
  '/',
  validate(startSchema),
  asyncHandler(async (req, res) => {
    const { kind } = req.body as { kind: 'voice' | 'video' };
    res.status(201).json({ call: await calls.startCall(req.user!.id, kind) });
  }),
);

callsRouter.post(
  '/:callId/end',
  validate(endSchema),
  asyncHandler(async (req, res) => {
    const { outcome } = req.body as { outcome: 'ENDED' | 'DECLINED' | 'CANCELLED' | 'MISSED' | 'FAILED' };
    await calls.endCall(req.user!.id, req.params.callId, outcome);
    res.json({ ok: true });
  }),
);
