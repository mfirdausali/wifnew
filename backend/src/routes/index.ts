import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import salesRoutes from './sales.routes';
import financeRoutes from './finance.routes';
import operationsRoutes from './operations.routes';
import healthRoutes from './health.routes';

const router = Router();

// Health check route (no auth required)
router.use('/health', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/sales', salesRoutes);
router.use('/finance', financeRoutes);
router.use('/operations', operationsRoutes);

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
        get: 'GET /api/users/:userId',
        update: 'PUT /api/users/:userId',
        updateRole: 'PATCH /api/users/:userId/role',
        updateStatus: 'PATCH /api/users/:userId/status',
        delete: 'DELETE /api/users/:userId',
        stats: 'GET /api/users/stats',
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
    },
  });
});

export default router;