import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { 
  checkPermissions, 
  requirePermissions,
  checkDepartmentPermission 
} from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/permissions
 * @desc Get all permissions grouped by category
 * @access Admin, or users with permission.view
 */
router.get(
  '/',
  requirePermissions('permission.view'),
  PermissionController.getPermissions
);

/**
 * @route GET /api/permissions/hierarchy
 * @desc Get permission hierarchy tree
 * @access Admin, or users with permission.view
 */
router.get(
  '/hierarchy',
  requirePermissions('permission.view'),
  PermissionController.getPermissionHierarchy
);

/**
 * @route GET /api/permissions/users/:userId
 * @desc Get user permissions
 * @access Admin, user themselves, or users with permission.view
 */
router.get(
  '/users/:userId',
  validate([
    param('userId').isUUID(),
    query('includeHierarchy').optional().isBoolean(),
  ]),
  checkPermissions(['permission.view'], {
    customCheck: async (req) => {
      // Users can view their own permissions
      return req.user?.id === req.params.userId;
    }
  }),
  PermissionController.getUserPermissions
);

/**
 * @route POST /api/permissions/users/:userId/grant
 * @desc Grant permissions to user
 * @access Admin or users with permission.grant
 */
router.post(
  '/users/:userId/grant',
  validate([
    param('userId').isUUID(),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('permissions.*').isString(),
    body('reason').optional().isString(),
    body('expiresAt').optional().isISO8601(),
  ]),
  checkPermissions(['permission.grant'], {
    require2fa: true,
    minAccessLevel: 3
  }),
  PermissionController.grantPermissions
);

/**
 * @route POST /api/permissions/users/:userId/revoke
 * @desc Revoke permissions from user
 * @access Admin or users with permission.revoke
 */
router.post(
  '/users/:userId/revoke',
  validate([
    param('userId').isUUID(),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('permissions.*').isString(),
    body('reason').optional().isString(),
  ]),
  checkPermissions(['permission.revoke'], {
    require2fa: true,
    minAccessLevel: 3
  }),
  PermissionController.revokePermissions
);

/**
 * @route POST /api/permissions/users/:userId/grant-temporary
 * @desc Grant temporary permission to user
 * @access Admin or users with permission.grant
 */
router.post(
  '/users/:userId/grant-temporary',
  validate([
    param('userId').isUUID(),
    body('permission').isString().notEmpty(),
    body('hours').isInt({ min: 1, max: 720 }), // Max 30 days
    body('reason').optional().isString(),
  ]),
  checkPermissions(['permission.grant', 'permission.grant_temporary'], {
    requireAny: true,
    require2fa: true
  }),
  PermissionController.grantTemporaryPermission
);

/**
 * @route POST /api/permissions/clone
 * @desc Clone permissions from one user to another
 * @access Admin or users with permission.grant
 */
router.post(
  '/clone',
  validate([
    body('sourceUserId').isUUID(),
    body('targetUserId').isUUID(),
  ]),
  checkPermissions(['permission.grant'], {
    require2fa: true,
    minAccessLevel: 4
  }),
  PermissionController.clonePermissions
);

/**
 * @route GET /api/permissions/users/:userId/audit
 * @desc Get permission audit log for user
 * @access Admin or users with permission.audit
 */
router.get(
  '/users/:userId/audit',
  validate([
    param('userId').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
  ]),
  requirePermissions('permission.audit'),
  PermissionController.getPermissionAuditLog
);

/**
 * @route GET /api/permissions/users/:userId/check
 * @desc Check if user has specific permission
 * @access Authenticated users can check their own permissions
 */
router.get(
  '/users/:userId/check',
  validate([
    param('userId').isUUID(),
    query('permission').isString().notEmpty(),
  ]),
  checkPermissions(['permission.view'], {
    customCheck: async (req) => {
      return req.user?.id === req.params.userId;
    }
  }),
  PermissionController.checkPermission
);

/**
 * @route GET /api/permissions/expired
 * @desc Get all expired permissions
 * @access Admin or users with permission.audit
 */
router.get(
  '/expired',
  requirePermissions('permission.audit'),
  PermissionController.getExpiredPermissions
);

/**
 * @route POST /api/permissions/expired/cleanup
 * @desc Cleanup expired permissions
 * @access Admin or users with permission.manage
 */
router.post(
  '/expired/cleanup',
  checkPermissions(['permission.manage'], {
    require2fa: true,
    minAccessLevel: 4
  }),
  PermissionController.cleanupExpiredPermissions
);

/**
 * @route POST /api/permissions
 * @desc Create new permission
 * @access Admin only
 */
router.post(
  '/',
  validate([
    body('code').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('description').optional().isString(),
    body('category').isString().notEmpty(),
    body('module').optional().isString(),
    body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('requires2fa').optional().isBoolean(),
    body('requiresApproval').optional().isBoolean(),
    body('defaultForRoles').optional().isArray(),
  ]),
  checkPermissions(['permission.create'], {
    require2fa: true,
    minAccessLevel: 5
  }),
  PermissionController.createPermission
);

/**
 * @route PUT /api/permissions/:permissionId
 * @desc Update permission
 * @access Admin only
 */
router.put(
  '/:permissionId',
  validate([
    param('permissionId').isUUID(),
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('category').optional().isString(),
    body('module').optional().isString(),
    body('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('requires2fa').optional().isBoolean(),
    body('requiresApproval').optional().isBoolean(),
    body('defaultForRoles').optional().isArray(),
  ]),
  checkPermissions(['permission.update'], {
    require2fa: true,
    minAccessLevel: 5
  }),
  PermissionController.updatePermission
);

/**
 * @route DELETE /api/permissions/:permissionId
 * @desc Delete permission
 * @access Admin only
 */
router.delete(
  '/:permissionId',
  validate([
    param('permissionId').isUUID(),
  ]),
  checkPermissions(['permission.delete'], {
    require2fa: true,
    minAccessLevel: 5
  }),
  PermissionController.deletePermission
);

export default router;