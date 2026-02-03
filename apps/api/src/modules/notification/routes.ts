import { Router } from 'express';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

// Get system alerts (public)
router.get('/alerts', async (req, res, next) => {
  try {
    const { serviceType, area } = req.query;
    
    const where: any = {
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    };
    
    if (serviceType) where.serviceType = serviceType as string;
    if (area) where.affectedArea = { contains: area as string };
    
    const alerts = await prisma.systemAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

// User notifications (authenticated)
router.get('/', authenticate, async (req: AuthReq, res, next) => {
  try {
    const { type, unreadOnly, page = '1', limit = '20' } = req.query;
    
    const where: any = { userId: req.user!.id };
    
    if (type) where.type = type as string;
    if (unreadOnly === 'true') where.isRead = false;
    
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user!.id, isRead: false },
      }),
    ]);
    
    // Return in user's preferred language
    const language = req.user!.language || 'en';
    
    const localizedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: language === 'hi' && n.titleHi ? n.titleHi : n.title,
      message: language === 'hi' && n.messageHi ? n.messageHi : n.message,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));
    
    res.json({
      success: true,
      data: localizedNotifications,
      unreadCount,
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

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthReq, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });
    
    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }
    
    await prisma.notification.update({
      where: { id: req.params.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthReq, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
