import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimit.middleware';
import { loginSchema, logoutSchema, refreshSchema, registerSchema, resetPasswordSchema } from './auth.schema';
import * as controller from './auth.controller';

const router = Router();

router.post('/register', registerLimiter, validate({ body: registerSchema }), controller.registerHandler);
router.post('/login', loginLimiter, validate({ body: loginSchema }), controller.loginHandler);
router.post('/refresh', loginLimiter, validate({ body: refreshSchema }), controller.refreshHandler);
router.post(
  '/reset-password',
  loginLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPasswordHandler,
);
router.post('/logout', validate({ body: logoutSchema }), controller.logoutHandler);
router.get('/me', ...controller.meHandler);

export default router;
