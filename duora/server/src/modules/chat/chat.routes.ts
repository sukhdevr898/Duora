import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { messageSendLimiter } from '../../middleware/rateLimit.middleware';
import {
  deleteForAllSchema,
  deleteForMeSchema,
  messagesQuerySchema,
  readSchema,
  sendMessageSchema,
  syncQuerySchema,
} from './chat.schema';
import * as controller from './chat.controller';

const router = Router();

router.get('/conversations', requireAuth, controller.listConversationsHandler);
router.post(
  '/messages',
  requireAuth,
  messageSendLimiter,
  validate({ body: sendMessageSchema }),
  controller.sendMessageHandler,
);
router.get(
  '/conversations/:id/messages',
  requireAuth,
  validate({ query: messagesQuerySchema }),
  controller.getMessagesHandler,
);
router.get(
  '/conversations/:id/sync',
  requireAuth,
  validate({ query: syncQuerySchema }),
  controller.syncHandler,
);
router.post('/conversations/:id/delivered', requireAuth, controller.deliveredHandler);
router.post(
  '/messages/read',
  requireAuth,
  validate({ body: readSchema }),
  controller.readHandler,
);
router.post(
  '/messages/delete-for-me',
  requireAuth,
  validate({ body: deleteForMeSchema }),
  controller.deleteForMeHandler,
);
router.post(
  '/messages/delete-for-all',
  requireAuth,
  validate({ body: deleteForAllSchema }),
  controller.deleteForAllHandler,
);

export default router;
