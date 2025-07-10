import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '@config/database';
import { HTTP_STATUS } from '@utils/constants';
import { getPaginationParams, createPaginatedResponse } from '@utils/helpers';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = Router();

// All operations routes require authentication and operations/admin role
router.use(authenticate);
router.use(authorize(UserRole.OPERATIONS, UserRole.ADMIN));

// Get operations dashboard stats
router.get('/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          ordersByStatus: ordersByStatus.map(item => ({
            status: item.status,
            count: item._count,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get orders for fulfillment
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { status, priority } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' }, // Pending first
          { createdAt: 'asc' }, // Oldest first
        ],
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              country: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const response = createPaginatedResponse(orders, total, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch('/orders/:orderId/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'ORDER_STATUS_UPDATE',
        resource: 'orders',
        resourceId: orderId,
        details: { 
          orderNumber: order.orderNumber,
          newStatus: status,
        },
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status updated successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

// Bulk update order statuses
router.patch('/orders/bulk-status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderIds, status } = req.body;

    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'BULK_ORDER_STATUS_UPDATE',
        resource: 'orders',
        details: { 
          orderCount: result.count,
          newStatus: status,
          orderIds,
        },
      },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.count} orders updated successfully`,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    next(error);
  }
});

// Get fulfillment metrics
router.get('/metrics/fulfillment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const [
      orderMetrics,
      averageProcessingTime,
      fulfillmentRate,
    ] = await Promise.all([
      // Orders by status in time period
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Average time from pending to delivered
      prisma.$queryRaw<any[]>`
        SELECT AVG(
          EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/3600
        ) as avg_hours
        FROM orders
        WHERE status = 'DELIVERED'
        AND "createdAt" >= ${startDate}
      `,
      // Fulfillment rate (delivered / total)
      prisma.order.count({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const totalOrders = await prisma.order.count({
      where: { createdAt: { gte: startDate } },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        metrics: {
          period: {
            days: Number(days),
            startDate,
            endDate: new Date(),
          },
          ordersByStatus: orderMetrics,
          averageProcessingHours: averageProcessingTime[0]?.avg_hours || 0,
          fulfillmentRate: totalOrders > 0 ? (fulfillmentRate / totalOrders) * 100 : 0,
          totalOrders,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get shipping queue
router.get('/shipping/queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const readyToShip = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
      },
      orderBy: {
        updatedAt: 'asc', // Oldest ready first
      },
      include: {
        customer: {
          select: {
            name: true,
            address: true,
            city: true,
            country: true,
          },
        },
      },
      take: 50, // Limit to 50 for queue view
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        queue: readyToShip,
        count: readyToShip.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;