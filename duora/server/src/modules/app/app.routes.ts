import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { homePayload } from '../home/home.service';

export const appRouter = Router();

appRouter.get(
  '/home',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await homePayload(req.user!.id));
  }),
);
