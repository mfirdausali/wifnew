import { Router } from 'express';
import { AdminController } from '@controllers/admin.controller';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard stats
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

// System health
router.get('/system/health', AdminController.getSystemHealth);

// Cache management
router.post('/cache/clear', AdminController.clearCache);

// Session management
router.get('/sessions', AdminController.getActiveSessions);
router.post('/sessions/:sessionId/terminate', AdminController.terminateSession);

export default router;