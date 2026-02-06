import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import { TariffService } from './tariff.service';
import { JobQueueService } from './job-queue.service';

const router = Router();

router.use(authenticate);

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

        // Verify connection ownership and status
        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
                serviceType: 'ELECTRICITY',
                status: 'ACTIVE',
            },
        });

        if (!connection) {
            throw new ApiError('Active electricity connection not found', 404);
        }

        // Validate reading
        if (connection.lastReading && reading < connection.lastReading) {
            throw new ApiError(
                `New reading (${reading}) cannot be less than previous reading (${connection.lastReading})`,
                400
            );
        }

        // Create meter reading
        const meterReading = await prisma.meterReading.create({
            data: {
                connectionId,
                reading,
                readingDate: new Date(),
                submittedBy: 'CITIZEN',
                imageUrl,
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

        // Create job to generate bill
        await JobQueueService.createJob('GENERATE_BILLS', {
            connectionId,
            meterReadingId: meterReading.id,
        });

        res.json({
            success: true,
            data: meterReading,
            message: 'Meter reading submitted successfully. Bill will be generated shortly.',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// BILL CALCULATION (DRY RUN)
// ============================================

const calculateBillSchema = z.object({
    connectionId: z.string(),
    unitsConsumed: z.number().positive(),
});

router.post('/calculate-bill', async (req: AuthReq, res, next) => {
    try {
        const { connectionId, unitsConsumed } = calculateBillSchema.parse(req.body);

        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
                serviceType: 'ELECTRICITY',
            },
        });

        if (!connection) {
            throw new ApiError('Electricity connection not found', 404);
        }

        if (!connection.loadType) {
            throw new ApiError('Connection load type not set. Please contact support.', 400);
        }

        const calculation = await TariffService.calculateBill(
            unitsConsumed,
            connection.loadType
        );

        res.json({
            success: true,
            data: calculation,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// GET ACTIVE TARIFFS
// ============================================

router.get('/tariffs', async (req: AuthReq, res, next) => {
    try {
        const tariffs = await TariffService.getActiveTariffs();

        // Group by load type
        const groupedTariffs = tariffs.reduce((acc: any, tariff) => {
            if (!acc[tariff.loadType]) {
                acc[tariff.loadType] = [];
            }
            acc[tariff.loadType].push(tariff);
            return acc;
        }, {});

        res.json({
            success: true,
            data: groupedTariffs,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// GET CONSUMPTION HISTORY
// ============================================

router.get('/consumption/:connectionId', async (req: AuthReq, res, next) => {
    try {
        const { connectionId } = req.params;
        const { months = '6' } = req.query;

        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId: req.user!.id,
                serviceType: 'ELECTRICITY',
            },
        });

        if (!connection) {
            throw new ApiError('Electricity connection not found', 404);
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
                    loadType: connection.loadType,
                    phase: connection.phase,
                    sanctionedLoad: connection.sanctionedLoad,
                },
                bills,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
