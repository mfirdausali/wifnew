import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { HTTP_STATUS } from '@utils/constants';
import { getPaginationParams, createPaginatedResponse } from '@utils/helpers';

export class AdminController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalOrders,
        totalCustomers,
        recentActivity,
        usersByRole,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      const stats = {
        totalUsers,
        activeUsers,
        totalOrders,
        totalCustomers,
        usersByRole: usersByRole.reduce((acc, curr) => {
          acc[curr.role] = curr._count;
          return acc;
        }, {} as Record<string, number>),
        recentActivity,
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(req);
      const { userId, action, resource } = req.query;

      const where: any = {};
      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (resource) where.resource = resource;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      const response = createPaginatedResponse(logs, total, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...response,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      // Check database connection
      const dbHealth = await prisma.$queryRaw`SELECT 1`
        .then(() => ({ status: 'healthy', message: 'Database connected' }))
        .catch((err) => ({ status: 'unhealthy', message: err.message }));

      // Check Redis connection
      const redisHealth = await redis.ping()
        .then(() => ({ status: 'healthy', message: 'Redis connected' }))
        .catch((err) => ({ status: 'unhealthy', message: err.message }));

      // Get system info
      const systemInfo = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          database: dbHealth,
          cache: redisHealth,
          system: systemInfo,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      await redis.flushdb();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(req);

      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where: { isActive: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        }),
        prisma.session.count({ where: { isActive: true } }),
      ]);

      const response = createPaginatedResponse(sessions, total, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...response,
      });
    } catch (error) {
      next(error);
    }
  }

  static async terminateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      const session = await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });

      // Also revoke the user's tokens
      const { TokenService } = await import('@services/token.service');
      await TokenService.revokeAllUserTokens(session.userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Session terminated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}