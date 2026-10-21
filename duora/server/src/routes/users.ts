/** Profile and the public user shape. */
import { asyncHandler } from '../util';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { validate } from '../http';
import { findById, toPublicUser, updateProfile } from '../users';

export { findById, toPublicUser, updateProfile, ensureSettings } from '../users';
export type { PublicUser, UserRow } from '../users';

/** The profile fields the app can change. */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  partnerNickname: z.string().min(1).max(40).nullable().optional(),
});

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
