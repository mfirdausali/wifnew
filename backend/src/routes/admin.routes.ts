import { Router } from 'express';
import { AdminController } from '@controllers/admin.controller';
import { authenticate, authorizeRole } from '@middleware/auth.middleware';
import { requirePermissions, checkPermissions } from '@middleware/permission.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard stats - available to all managers with specific view permissions
router.get(
  '/dashboard/stats',
  requirePermissions('system.view_audit'),
  AdminController.getDashboardStats
);

// Audit logs - requires audit permission
router.get(
  '/audit-logs',
  requirePermissions('system.view_audit'),
  AdminController.getAuditLogs
);

// System health - requires system config permission
router.get(
  '/system/health',
  checkPermissions(['system.config', 'system.view_audit'], { requireAny: true }),
  AdminController.getSystemHealth
);

// Cache management - requires system config permission
router.post(
  '/cache/clear',
  checkPermissions(['system.config'], { 
    require2fa: true,
    minAccessLevel: 4 
  }),
  AdminController.clearCache
);

// Session management - requires user management permissions
router.get(
  '/sessions',
  requirePermissions('users.view'),
  AdminController.getActiveSessions
);

router.post(
  '/sessions/:sessionId/terminate',
  checkPermissions(['users.update'], {
    require2fa: true,
    minAccessLevel: 3
  }),
  AdminController.terminateSession
);

export default router;