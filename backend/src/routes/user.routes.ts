import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '@middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamSchema,
  getUsersQuerySchema,
} from '@validators/user.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get users (Admin only)
router.get(
  '/',
  authorize(UserRole.ADMIN),
  validateQuery(getUsersQuerySchema),
  UserController.getUsers
);

// Get user stats (Admin only)
router.get(
  '/stats',
  authorize(UserRole.ADMIN),
  UserController.getUserStats
);

// Create user (Admin only)
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createUserSchema),
  UserController.createUser
);

// Get user by ID (Admin only)
router.get(
  '/:userId',
  authorize(UserRole.ADMIN),
  validateParams(userIdParamSchema),
  UserController.getUserById
);

// Update user (Admin only)
router.put(
  '/:userId',
  authorize(UserRole.ADMIN),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  UserController.updateUser
);

// Update user role (Admin only)
router.patch(
  '/:userId/role',
  authorize(UserRole.ADMIN),
  validateParams(userIdParamSchema),
  validate(updateUserRoleSchema),
  UserController.updateUserRole
);

// Update user status (Admin only)
router.patch(
  '/:userId/status',
  authorize(UserRole.ADMIN),
  validateParams(userIdParamSchema),
  validate(updateUserStatusSchema),
  UserController.updateUserStatus
);

// Delete user (Admin only)
router.delete(
  '/:userId',
  authorize(UserRole.ADMIN),
  validateParams(userIdParamSchema),
  UserController.deleteUser
);

export default router;