import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import * as devicesService from './devices.service';

const router = Router();
router.use(requireAuth);

const pushTokenSchema = z.object({
  pushToken: z.string().min(10).max(4096),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
  deviceId: z.string().max(200).optional(),
});

router.post(
  '/push-token',
  validate({ body: pushTokenSchema }),
  asyncHandler(async (req, res) => {
    const device = await devicesService.upsertPushToken(req.user!.id, req.body);
    res.status(201).json({ device: { id: device.id } });
  }),
);

router.delete(
  '/push-token',
  validate({ body: z.object({ pushToken: z.string().min(10).max(4096) }) }),
  asyncHandler(async (req, res) => {
    await devicesService.removePushToken(req.user!.id, req.body.pushToken);
    res.status(204).end();
  }),
);

export default router;
