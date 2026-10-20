import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { callLimiter } from '../../middleware/rateLimit.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { callIdParamSchema, initiateCallSchema } from './calls.schema';
import * as callsService from './calls.service';

const router = Router();

router.post(
  '/calls',
  requireAuth,
  callLimiter,
  validate({ body: initiateCallSchema }),
  asyncHandler(async (req, res) => {
    const result = await callsService.initiateCall(req.user!.id, req.body.callType);
    res.status(201).json(result);
  }),
);

router.get(
  '/calls/active',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ call: await callsService.getActiveCall(req.user!.id) });
  }),
);

router.get(
  '/calls/:callId/ice',
  requireAuth,
  validate({ params: callIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await callsService.getIceForCall(req.params.callId, req.user!.id));
  }),
);

router.post(
  '/calls/:callId/accept',
  requireAuth,
  callLimiter,
  validate({ params: callIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json({ call: await callsService.acceptCall(req.params.callId, req.user!.id) });
  }),
);

router.post(
  '/calls/:callId/decline',
  requireAuth,
  validate({ params: callIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json({ call: await callsService.declineCall(req.params.callId, req.user!.id) });
  }),
);

router.post(
  '/calls/:callId/cancel',
  requireAuth,
  validate({ params: callIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json({ call: await callsService.cancelCall(req.params.callId, req.user!.id) });
  }),
);

router.post(
  '/calls/:callId/end',
  requireAuth,
  validate({ params: callIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json({ call: await callsService.endCall(req.params.callId, req.user!.id) });
  }),
);

export default router;
