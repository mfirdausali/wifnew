import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'Multi-Role Authentication API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

export default router;