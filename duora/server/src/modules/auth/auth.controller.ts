import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { requireAuth } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import type { LoginInput, RegisterInput } from './auth.schema';

function meta(req: Request) {
  return { userAgent: req.header('user-agent') ?? undefined, ip: req.ip };
}

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput, meta(req));
  res.status(201).json(result);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await authService.login(
    { email: input.email, password: input.password },
    meta(req),
  );
  if (input.device?.pushToken) {
    // Registration of the push token is best-effort during login and never
    // blocks authentication. The devices endpoint remains the canonical path.
    const { upsertPushToken } = await import('../devices/devices.service.js');
    await upsertPushToken(result.user.id, {
      pushToken: input.device.pushToken,
      platform: input.device.platform,
      deviceId: input.device.deviceId,
    });
  }
  res.json(result);
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refresh(req.body.refreshToken as string);
  res.json({ tokens });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken as string);
  res.status(204).end();
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.requestPasswordReset(req.body.email as string);
  res.status(202).json(result);
});

export const meHandler = [
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    res.json({ user });
  }),
];
