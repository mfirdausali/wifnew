import { Router, Request, Response } from 'express';
import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { HTTP_STATUS } from '@utils/constants';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'OK',
      message: 'Service is healthy',
    };

    res.status(HTTP_STATUS.OK).json(healthcheck);
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'ERROR',
      message: 'Service is unhealthy',
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Check database
    const dbHealth = await prisma.$queryRaw`SELECT 1`
      .then(() => ({ status: 'healthy', latency: 0 }))
      .catch((err) => ({ status: 'unhealthy', error: err.message }));

    // Check Redis
    const redisStart = Date.now();
    const redisHealth = await redis.ping()
      .then(() => ({ status: 'healthy', latency: Date.now() - redisStart }))
      .catch((err) => ({ status: 'unhealthy', error: err.message }));

    const health = {
      status: dbHealth.status === 'healthy' && redisHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        cache: redisHealth,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
      },
    };

    const statusCode = health.status === 'OK' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'ERROR',
      message: 'Failed to check service health',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Readiness check
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);

    res.status(HTTP_STATUS.OK).json({
      status: 'READY',
      message: 'Service is ready to accept requests',
    });
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'NOT_READY',
      message: 'Service is not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Liveness check
router.get('/live', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'ALIVE',
    message: 'Service is alive',
    timestamp: Date.now(),
  });
});

export default router;