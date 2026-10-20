import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { updateProfileSchema, updateSettingsSchema } from './users.schema';
import * as usersService from './users.service';

const router = Router();
router.use(requireAuth);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ user: await usersService.getProfile(req.user!.id) });
  }),
);

router.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    res.json({ user: await usersService.updateProfile(req.user!.id, req.body) });
  }),
);

router.get(
  '/me/settings',
  asyncHandler(async (req, res) => {
    res.json({ settings: await usersService.getSettings(req.user!.id) });
  }),
);

router.put(
  '/me/settings',
  validate({ body: updateSettingsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ settings: await usersService.updateSettings(req.user!.id, req.body) });
  }),
);

router.delete(
  '/me',
  asyncHandler(async (req, res) => {
    await usersService.deleteAccount(req.user!.id);
    res.status(204).end();
  }),
);

export default router;
