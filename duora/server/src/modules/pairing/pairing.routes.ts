import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { invitationLimiter, verifyLimiter } from '../../middleware/rateLimit.middleware';
import {
  acceptInvitationSchema,
  createInvitationSchema,
  unpairSchema,
  verifyCodeSchema,
} from './pairing.schema';
import * as controller from './pairing.controller';

const router = Router();
router.use(requireAuth);

router.get('/current', controller.currentHandler);
router.post(
  '/invitations',
  invitationLimiter,
  validate({ body: createInvitationSchema }),
  controller.createInvitationHandler,
);
router.get('/invitations/preview', verifyLimiter, controller.previewHandler);
router.post('/verify', verifyLimiter, validate({ body: verifyCodeSchema }), controller.verifyHandler);
router.post('/accept', verifyLimiter, validate({ body: acceptInvitationSchema }), controller.acceptHandler);
router.delete('/current', validate({ body: unpairSchema }), controller.unpairHandler);

export default router;
