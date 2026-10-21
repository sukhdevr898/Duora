import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as settings from './settings.service';

const patchSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent: z.enum(['violet', 'rose', 'sunset', 'mint']).optional(),
  loveMode: z.boolean().optional(),
  heartMotion: z.boolean().optional(),
  glass: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  callNotifications: z.boolean().optional(),
  ringtone: z.string().max(40).optional(),
  vibration: z.boolean().optional(),
  hidePreview: z.boolean().optional(),
  lowData: z.boolean().optional(),
});

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ settings: await settings.getSettings(req.user!.id) });
  }),
);

settingsRouter.patch(
  '/',
  validate(patchSchema),
  asyncHandler(async (req, res) => {
    res.json({ settings: await settings.updateSettings(req.user!.id, req.body as never) });
  }),
);
