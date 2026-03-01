import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { gasService } from './gas.service';
import { prisma } from '@suvidha/database';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// ============================================
// GAS CONNECTIONS
// ============================================

router.get('/connections', async (req: AuthReq, res, next) => {
    try {
        const connections = await gasService.getConnections(req.user!.id);
        res.json({
            success: true,
            data: connections,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// LPG CYLINDER BOOKING
// ============================================

const bookRefillSchema = z.object({
    connectionId: z.string(),
    amount: z.number().positive(),
});

router.post('/book', async (req: AuthReq, res, next) => {
    try {
        const { connectionId, amount } = bookRefillSchema.parse(req.body);
        const booking = await gasService.bookRefill(req.user!.id, connectionId, amount);

        res.status(201).json({
            success: true,
            data: booking,
            message: 'Gas cylinder booked successfully',
        });
    } catch (error) {
        next(error);
    }
});

router.get('/bookings', async (req: AuthReq, res, next) => {
    try {
        const { connectionId } = req.query;
        const bookings = await gasService.getBookingHistory(
            req.user!.id,
            connectionId as string
        );
        res.json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// METERED GAS (PNG)
// ============================================

const submitReadingSchema = z.object({
    connectionId: z.string(),
    reading: z.number().nonnegative(),
    imageUrl: z.string().url().optional(),
});

router.post('/readings', async (req: AuthReq, res, next) => {
    try {
        const { connectionId, reading, imageUrl } = submitReadingSchema.parse(req.body);
        const result = await gasService.submitReading(req.user!.id, connectionId, reading, imageUrl);

        res.status(201).json({
            success: true,
            data: result,
            message: 'Reading submitted successfully and bill generated',
        });
    } catch (error) {
        next(error);
    }
});

router.post('/calculate-bill', async (req: AuthReq, res, next) => {
    try {
        const { unitsConsumed } = z.object({ unitsConsumed: z.number() }).parse(req.body);
        const estimate = await gasService.calculateBill(unitsConsumed);

        res.json({
            success: true,
            data: estimate,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// CONSUMPTION HISTORY (For Chart)
// ============================================

router.get('/consumption/:connectionId', async (req: AuthReq, res, next) => {
    try {
        const { connectionId } = req.params;
        const { months = '6' } = req.query;

        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
                serviceType: 'GAS',
            },
        });

        if (!connection) {
            throw new ApiError('Gas connection not found', 404);
        }

        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));

        const bills = await prisma.bill.findMany({
            where: {
                connectionId,
                billDate: { gte: monthsAgo },
            },
            orderBy: { billDate: 'desc' },
            select: {
                billNo: true,
                billDate: true,
                periodFrom: true,
                periodTo: true,
                unitsConsumed: true,
                amount: true,
                status: true,
            },
        });

        res.json({
            success: true,
            data: {
                connection: {
                    connectionNo: connection.connectionNo,
                    provider: connection.provider,
                    agency: connection.agency,
                },
                bills,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
