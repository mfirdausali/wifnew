import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../middleware/validation.middleware';
import { rateLimiter } from '../middleware/rateLimiter.middleware';
import { cache } from '../middleware/cache.middleware';
import {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  bulkUpdateUsersSchema,
  exportUsersSchema,
  importUsersSchema,
  userIdParamSchema,
  getUserQuerySchema,
} from '../validators/users.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - List users with pagination and filters
router.get(
  '/',
  authorize('users.view'),
  validateQuery(listUsersSchema),
  rateLimiter('users-list', { windowMs: 60000, max: 100 }),
  cache('users-list', 300), // 5 minutes cache
  UsersController.listUsers
);

// POST /api/users - Create new user
router.post(
  '/',
  authorize('users.create'),
  validate(createUserSchema),
  rateLimiter('users-create', { windowMs: 60000, max: 20 }),
  UsersController.createUser
);

// GET /api/users/export - Export users data
router.get(
  '/export',
  authorize('users.export'),
  validateQuery(exportUsersSchema),
  rateLimiter('users-export', { windowMs: 60000, max: 5 }),
  UsersController.exportUsers
);

// POST /api/users/import - Import users data
router.post(
  '/import',
  authorize('users.import'),
  validate(importUsersSchema),
  rateLimiter('users-import', { windowMs: 60000, max: 5 }),
  UsersController.importUsers
);

// POST /api/users/bulk-update - Bulk update users
router.post(
  '/bulk-update',
  authorize('users.bulk-edit'),
  validate(bulkUpdateUsersSchema),
  rateLimiter('users-bulk', { windowMs: 60000, max: 10 }),
  UsersController.bulkUpdateUsers
);

// GET /api/users/:id - Get single user
router.get(
  '/:id',
  validateParams(userIdParamSchema),
  validateQuery(getUserQuerySchema),
  rateLimiter('users-get', { windowMs: 60000, max: 200 }),
  cache('user-detail', 600), // 10 minutes cache
  UsersController.getUser
);

// PUT /api/users/:id - Update user
router.put(
  '/:id',
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  rateLimiter('users-update', { windowMs: 60000, max: 50 }),
  UsersController.updateUser
);

// DELETE /api/users/:id - Delete user
router.delete(
  '/:id',
  authorize('users.delete'),
  validateParams(userIdParamSchema),
  rateLimiter('users-delete', { windowMs: 60000, max: 10 }),
  UsersController.deleteUser
);

// PATCH /api/users/:id/status - Update user status
router.patch(
  '/:id/status',
  authorize('users.manage-status'),
  validateParams(userIdParamSchema),
  validate(updateUserStatusSchema),
  rateLimiter('users-status', { windowMs: 60000, max: 30 }),
  UsersController.updateUserStatus
);

// PATCH /api/users/:id/role - Update user role
router.patch(
  '/:id/role',
  authorize('users.manage-role'),
  validateParams(userIdParamSchema),
  validate(updateUserRoleSchema),
  rateLimiter('users-role', { windowMs: 60000, max: 30 }),
  UsersController.updateUserRole
);

export default router;