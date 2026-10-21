import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as pairing from './pairing.service';
import { acceptByCodeSchema, acceptByTokenSchema, scanSchema } from './pairing.schema';

export const pairingRouter = Router();
pairingRouter.use(requireAuth);

/** Everything the Pairing screen needs in one call. */
pairingRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json(await pairing.statusFor(req.user!.id));
  }),
);

/** Create / refresh the 6-char code + QR payload. */
pairingRouter.post(
  '/invitation',
  asyncHandler(async (req, res) => {
    res.status(201).json(await pairing.createInvitation(req.user!.id));
  }),
);

/** Partner entered a code. */
pairingRouter.post(
  '/accept',
  validate(acceptByCodeSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.body as { code: string };
    res.json(await pairing.acceptByCode(req.user!.id, code));
  }),
);

/** Partner scanned a QR code. */
pairingRouter.post(
  '/scan',
  validate(acceptByTokenSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token: string };
    res.json(await pairing.acceptByToken(req.user!.id, token));
  }),
);

/** Raw QR payload → token (supports `duora://pair?token=…` and bare tokens). */
pairingRouter.post(
  '/resolve',
  validate(scanSchema),
  asyncHandler(async (req, res) => {
    const raw = (req.body as { data: string }).data.trim();
    const token = raw.includes('token=')
      ? new URL(raw.replace('duora://', 'https://')).searchParams.get('token') ?? ''
      : raw;
    res.json({ token });
  }),
);

pairingRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await pairing.unlink(req.user!.id));
  }),
);
