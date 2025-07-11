import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import adminRoutes from './admin.routes';
import salesRoutes from './sales.routes';
import financeRoutes from './finance.routes';
import operationsRoutes from './operations.routes';
import healthRoutes from './health.routes';
import permissionRoutes from './permission.routes';
import activityRoutes from './activity.routes';

const router = Router();

// Health check route (no auth required)
router.use('/health', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/sales', salesRoutes);
router.use('/finance', financeRoutes);
router.use('/operations', operationsRoutes);
router.use('/permissions', permissionRoutes);
router.use('/activities', activityRoutes);

// API documentation route
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Multi-Role Authentication API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh',
        changePassword: 'POST /api/auth/change-password',
        profile: 'GET /api/auth/profile',
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        updateStatus: 'PATCH /api/users/:id/status',
        updateRole: 'PATCH /api/users/:id/role',
        bulkUpdate: 'POST /api/users/bulk-update',
        export: 'GET /api/users/export',
        import: 'POST /api/users/import',
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard/stats',
        auditLogs: 'GET /api/admin/audit-logs',
        systemHealth: 'GET /api/admin/system/health',
        clearCache: 'POST /api/admin/cache/clear',
        sessions: 'GET /api/admin/sessions',
        terminateSession: 'POST /api/admin/sessions/:sessionId/terminate',
      },
      sales: {
        dashboard: 'GET /api/sales/dashboard/stats',
        customers: 'GET /api/sales/customers',
        createCustomer: 'POST /api/sales/customers',
        orders: 'GET /api/sales/orders',
        reports: 'GET /api/sales/reports/summary',
      },
      finance: {
        dashboard: 'GET /api/finance/dashboard/stats',
        transactions: 'GET /api/finance/transactions',
        invoices: 'GET /api/finance/invoices',
        revenueReport: 'GET /api/finance/reports/revenue',
        summaryReport: 'GET /api/finance/reports/summary',
      },
      operations: {
        dashboard: 'GET /api/operations/dashboard/stats',
        orders: 'GET /api/operations/orders',
        updateOrderStatus: 'PATCH /api/operations/orders/:orderId/status',
        bulkUpdateStatus: 'PATCH /api/operations/orders/bulk-status',
        metrics: 'GET /api/operations/metrics/fulfillment',
        shippingQueue: 'GET /api/operations/shipping/queue',
      },
      permissions: {
        list: 'GET /api/permissions',
        hierarchy: 'GET /api/permissions/hierarchy',
        userPermissions: 'GET /api/permissions/users/:userId',
        grant: 'POST /api/permissions/users/:userId/grant',
        revoke: 'POST /api/permissions/users/:userId/revoke',
        grantTemporary: 'POST /api/permissions/users/:userId/grant-temporary',
        clone: 'POST /api/permissions/clone',
        audit: 'GET /api/permissions/users/:userId/audit',
        check: 'GET /api/permissions/users/:userId/check',
        expired: 'GET /api/permissions/expired',
        cleanupExpired: 'POST /api/permissions/expired/cleanup',
        create: 'POST /api/permissions',
        update: 'PUT /api/permissions/:permissionId',
        delete: 'DELETE /api/permissions/:permissionId',
      },
      activities: {
        metadata: 'GET /api/activities/metadata',
        myActivities: 'GET /api/activities/my-activities',
        list: 'GET /api/activities',
        stats: 'GET /api/activities/stats',
        feed: 'GET /api/activities/feed',
        export: 'GET /api/activities/export',
        userTimeline: 'GET /api/activities/users/:userId/timeline',
        checkSuspicious: 'GET /api/activities/users/:userId/suspicious',
        generateReport: 'POST /api/activities/users/:userId/report',
      },
    },
  });
});

export default router;