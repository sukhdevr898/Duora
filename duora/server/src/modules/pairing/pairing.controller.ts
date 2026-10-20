import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as pairingService from './pairing.service';

export const createInvitationHandler = asyncHandler(async (req: Request, res: Response) => {
  const invitation = await pairingService.createInvitation(req.user!.id);
  res.status(201).json({ invitation });
});

export const previewHandler = asyncHandler(async (req: Request, res: Response) => {
  const invitation = await pairingService.previewInvitation(req.user!.id, req.query as { code?: string; token?: string });
  res.json({ invitation });
});

export const verifyHandler = asyncHandler(async (req: Request, res: Response) => {
  const invitation = await pairingService.verifyCode(req.user!.id, req.body.code as string);
  res.json({ invitation });
});

export const acceptHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await pairingService.acceptInvitation(req.user!.id, req.body);
  res.status(201).json({ pairing: result });
});

export const currentHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ pairing: await pairingService.getCurrentPairing(req.user!.id) });
});

export const unpairHandler = asyncHandler(async (req: Request, res: Response) => {
  await pairingService.unpair(req.user!.id);
  res.status(204).end();
});
