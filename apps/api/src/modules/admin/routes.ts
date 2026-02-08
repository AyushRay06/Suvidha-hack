import { Router } from 'express';
import { prisma } from '@suvidha/database';
import { authenticate, requireRole, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin/staff role
router.use(authenticate);
router.use(requireRole('ADMIN', 'STAFF'));

// Dashboard stats
router.get('/dashboard', async (req: AuthReq, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalConnections,
      pendingGrievances,
      todayPayments,
      todayPaymentsAmount,
      activeAlerts,
      recentGrievances,
      paymentsByService,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.serviceConnection.count({ where: { status: 'ACTIVE' } }),
      prisma.grievance.count({ where: { status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
      prisma.payment.count({ where: { createdAt: { gte: today }, status: 'SUCCESS' } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: today }, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.systemAlert.count({ where: { isActive: true } }),
      prisma.grievance.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, phone: true } } },
      }),
      prisma.bill.groupBy({
        by: ['connectionId'],
        _sum: { amountPaid: true },
        where: { status: 'PAID' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalConnections,
          pendingGrievances,
          todayPayments,
          todayPaymentsAmount: todayPaymentsAmount._sum.amount || 0,
          activeAlerts,
        },
        recentGrievances,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all grievances (Admin)
router.get('/grievances', async (req: AuthReq, res, next) => {
  try {
    const { status, serviceType, page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (status && status !== 'all') where.status = status as string;
    if (serviceType) where.serviceType = serviceType as string;

    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          connection: { select: { connectionNo: true, serviceType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.grievance.count({ where }),
    ]);

    res.json({
      success: true,
      data: grievances,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Reports
router.get('/reports', async (req: AuthReq, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    let report;

    switch (type) {
      case 'payments':
        report = await prisma.payment.groupBy({
          by: ['status'],
          _count: true,
          _sum: { amount: true },
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        break;

      case 'grievances':
        report = await prisma.grievance.groupBy({
          by: ['serviceType', 'status'],
          _count: true,
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        break;

      case 'connections':
        report = await prisma.serviceConnection.groupBy({
          by: ['serviceType', 'status'],
          _count: true,
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        break;

      default:
        throw new ApiError('Invalid report type', 400);
    }

    res.json({
      success: true,
      data: {
        type,
        period: { start, end },
        report,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Kiosk management
router.get('/kiosks', async (req: AuthReq, res, next) => {
  try {
    const kiosks = await prisma.kiosk.findMany({
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { lastPingAt: 'desc' },
    });

    res.json({
      success: true,
      data: kiosks,
    });
  } catch (error) {
    next(error);
  }
});

// Create system alert
router.post('/alerts', async (req: AuthReq, res, next) => {
  try {
    const { serviceType, title, titleHi, message, messageHi, affectedArea, severity, endsAt } = req.body;

    const alert = await prisma.systemAlert.create({
      data: {
        serviceType,
        title,
        titleHi,
        message,
        messageHi,
        affectedArea,
        severity: severity || 'info',
        startsAt: new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate alert
router.put('/alerts/:id/deactivate', async (req: AuthReq, res, next) => {
  try {
    const alert = await prisma.systemAlert.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (for staff)
router.get('/users', async (req: AuthReq, res, next) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

    const where: any = { role: 'CITIZEN' };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          city: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { connections: true, grievances: true },
          },
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
