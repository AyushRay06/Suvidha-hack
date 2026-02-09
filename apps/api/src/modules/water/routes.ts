import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import { WaterTariffService } from './water.service';

const router = Router();

router.use(authenticate);

// ============================================
// WATER CONNECTIONS
// ============================================

router.get('/connections', async (req: AuthReq, res, next) => {
    try {
        const connections = await prisma.serviceConnection.findMany({
            where: {
                userId: req.user!.id,
                serviceType: 'WATER',
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: connections,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// METER READING SUBMISSION
// ============================================

const submitReadingSchema = z.object({
    connectionId: z.string(),
    reading: z.number().nonnegative(),
    imageUrl: z.string().url().optional(),
});

router.post('/readings', async (req: AuthReq, res, next) => {
    try {
        const { connectionId, reading, imageUrl } = submitReadingSchema.parse(req.body);

        // Verify connection ownership
        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
                serviceType: 'WATER',
                status: 'ACTIVE',
            },
        });

        if (!connection) {
            throw new ApiError('Active water connection not found', 404);
        }

        // Validate reading (must be >= last reading)
        if (connection.lastReading && reading < connection.lastReading) {
            throw new ApiError(
                `New reading (${reading}) cannot be less than previous reading (${connection.lastReading})`,
                400
            );
        }

        // Calculate consumption
        const previousReading = connection.lastReading || 0;
        const unitsConsumed = reading - previousReading;

        // Calculate bill
        const loadType = connection.loadType || 'DOMESTIC';
        const billCalculation = await WaterTariffService.calculateBill(unitsConsumed, loadType);

        // Create meter reading
        const meterReading = await prisma.meterReading.create({
            data: {
                connectionId,
                userId: req.user!.id,
                serviceType: 'WATER',
                reading,
                previousReading,
                consumption: unitsConsumed,
                readingDate: new Date(),
                submittedBy: 'CITIZEN',
                photoUrl: imageUrl,
                status: 'PENDING',
                isVerified: false,
            },
        });

        // Determine billing period
        const periodFrom = connection.lastReadingDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
        const periodTo = new Date();

        // Generate bill
        const billNo = `WATER-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        const bill = await prisma.bill.create({
            data: {
                userId: req.user!.id,
                connectionId,
                billNo,
                billDate: new Date(),
                dueDate,
                periodFrom,
                periodTo,
                unitsConsumed,
                amount: billCalculation.totalAmount,
                totalAmount: billCalculation.totalAmount,
            },
        });

        // Update connection
        await prisma.serviceConnection.update({
            where: { id: connectionId },
            data: {
                lastReading: reading,
                lastReadingDate: new Date(),
            },
        });

        res.status(201).json({
            success: true,
            data: {
                meterReading,
                bill,
                calculation: billCalculation,
            },
            message: 'Meter reading submitted and bill generated successfully.',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// BILL CALCULATION (DRY RUN / ESTIMATE)
// ============================================

const calculateBillSchema = z.object({
    unitsConsumed: z.number().nonnegative(),
    loadType: z.string().optional(),
});

router.post('/calculate-bill', async (req: AuthReq, res, next) => {
    try {
        const { unitsConsumed, loadType = 'DOMESTIC' } = calculateBillSchema.parse(req.body);
        const calculation = await WaterTariffService.calculateBill(unitsConsumed, loadType);

        res.json({
            success: true,
            data: calculation,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// CONSUMPTION HISTORY
// ============================================

router.get('/consumption/:connectionId', async (req: AuthReq, res, next) => {
    try {
        const { connectionId } = req.params;
        const { months = '6' } = req.query;

        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
                serviceType: 'WATER',
            },
        });

        if (!connection) {
            throw new ApiError('Water connection not found', 404);
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
                    meterNo: connection.meterNo,
                    loadType: connection.loadType,
                    address: connection.address,
                },
                bills,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
