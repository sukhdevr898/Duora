import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { db } from '../../db/client';
import { id, nowIso } from '../../utils/ids';
import { deviceSchema } from './devices.schema';

export const devicesRouter = Router();
devicesRouter.use(requireAuth);

devicesRouter.post(
  '/',
  validate(deviceSchema),
  asyncHandler(async (req, res) => {
    const { pushToken, platform, deviceId } = req.body as {
      pushToken: string;
      platform: string;
      deviceId?: string;
    };
    const now = nowIso();
    const existing = await db().one<{ id: string }>(
      'SELECT id FROM devices WHERE push_token = ?',
      [pushToken],
    );
    if (existing) {
      await db().run('UPDATE devices SET last_seen_at = ?, platform = ? WHERE id = ?', [
        now,
        platform,
        existing.id,
      ]);
      res.json({ deviceId: existing.id });
      return;
    }
    const deviceIdRow = id('dev');
    await db().run(
      `INSERT INTO devices (id, user_id, push_token, platform, device_id, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [deviceIdRow, req.user!.id, pushToken, platform, deviceId ?? null, now, now],
    );
    res.status(201).json({ deviceId: deviceIdRow });
  }),
);

devicesRouter.delete(
  '/:deviceId',
  asyncHandler(async (req, res) => {
    await db().run('DELETE FROM devices WHERE id = ? AND user_id = ?', [
      req.params.deviceId,
      req.user!.id,
    ]);
    res.status(204).send();
  }),
);
