import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '@config/database';
import { HTTP_STATUS } from '@utils/constants';
import { getPaginationParams, createPaginatedResponse } from '@utils/helpers';

const router = Router();

// All finance routes require authentication and finance/admin role
router.use(authenticate);
router.use(authorize(UserRole.FINANCE, UserRole.ADMIN));

// Get finance dashboard stats
router.get('/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [
      totalRevenue,
      monthlyRevenue,
      pendingInvoices,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: currentMonth },
        },
      }),
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        stats: {
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
          pendingInvoices,
          revenueByStatus: ordersByStatus.map(item => ({
            status: item.status,
            count: item._count,
            amount: item._sum.totalAmount || 0,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get financial transactions
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { startDate, endDate, status } = req.query;

    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const response = createPaginatedResponse(transactions, total, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
});

// Get invoices
router.get('/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { status, customerId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [invoices, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const response = createPaginatedResponse(invoices, total, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
});

// Financial reports
router.get('/reports/revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    // Get revenue by month for the specified year
    const startDate = new Date(Number(year), 0, 1);
    const endDate = new Date(Number(year), 11, 31, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
        status: true,
      },
    });

    // Group by month
    const revenueByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      orderCount: 0,
    }));

    orders.forEach(order => {
      const month = order.createdAt.getMonth();
      revenueByMonth[month].revenue += Number(order.totalAmount);
      revenueByMonth[month].orderCount += 1;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        report: {
          year: Number(year),
          period,
          data: revenueByMonth,
          total: {
            revenue: revenueByMonth.reduce((sum, month) => sum + month.revenue, 0),
            orders: revenueByMonth.reduce((sum, month) => sum + month.orderCount, 0),
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get financial summary
router.get('/reports/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate || endDate ? {
      createdAt: {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) }),
      },
    } : {};

    const [
      revenue,
      customerStats,
      orderStats,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _max: { totalAmount: true },
        _min: { totalAmount: true },
        where: dateFilter,
      }),
      prisma.customer.aggregate({
        _count: true,
        where: dateFilter,
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { totalAmount: true },
        where: dateFilter,
      }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        summary: {
          revenue: {
            total: revenue._sum.totalAmount || 0,
            average: revenue._avg.totalAmount || 0,
            highest: revenue._max.totalAmount || 0,
            lowest: revenue._min.totalAmount || 0,
          },
          customers: {
            total: customerStats._count,
          },
          ordersByStatus: orderStats,
          period: {
            start: startDate || 'All time',
            end: endDate || 'Present',
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;