import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema } from '../auth/auth.schema';
import { findById, toPublicUser, updateProfile } from './users.service';

export const usersRouter = Router();

usersRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findById(req.user!.id);
    res.json({ user: user ? toPublicUser(user) : null });
  }),
);

usersRouter.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.user!.id, req.body as never);
    res.json({ user });
  }),
);
