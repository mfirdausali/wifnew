import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate } from '@middleware/auth.middleware';
import { authLimiter } from '@middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '@validators/auth.validator';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

// Protected routes
router.use(authenticate);

router.post('/logout', AuthController.logout);

router.post(
  '/change-password',
  validate(changePasswordSchema),
  AuthController.changePassword
);

router.get('/profile', AuthController.getProfile);

export default router;