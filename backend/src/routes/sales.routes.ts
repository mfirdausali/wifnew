import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '@config/database';
import { HTTP_STATUS } from '@utils/constants';
import { getPaginationParams, createPaginatedResponse } from '@utils/helpers';

const router = Router();

// All sales routes require authentication and sales/admin role
router.use(authenticate);
router.use(authorize(UserRole.SALES, UserRole.ADMIN));

// Get sales dashboard stats
router.get('/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalCustomers,
      totalOrders,
      pendingOrders,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)), // First day of current month
          },
        },
      }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalOrders,
          pendingOrders,
          monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get customers
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const response = createPaginatedResponse(customers, total, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
});

// Create customer
router.post('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
});

// Get orders
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const status = req.query.status as string;

    const where = status ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
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

    const response = createPaginatedResponse(orders, total, page, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
});

// Sales reports
router.get('/reports/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {
      createdAt: {
        gte: startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
        lte: endDate ? new Date(endDate as string) : new Date(),
      },
    };

    const [orderStats, customerGrowth, topCustomers] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: dateFilter,
      }),
      prisma.customer.count({
        where: dateFilter,
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        _sum: { totalAmount: true },
        _count: true,
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        report: {
          totalRevenue: orderStats._sum.totalAmount || 0,
          totalOrders: orderStats._count,
          newCustomers: customerGrowth,
          topCustomers,
          period: {
            start: dateFilter.createdAt.gte,
            end: dateFilter.createdAt.lte,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;