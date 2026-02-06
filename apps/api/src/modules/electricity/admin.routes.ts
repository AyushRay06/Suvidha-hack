import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Middleware to check admin role
const requireAdmin = (req: AuthReq, res: any, next: any) => {
    if (req.user?.role !== 'ADMIN') {
        throw new ApiError('Admin access required', 403);
    }
    next();
};

router.use(requireAdmin);

// ============================================
// TARIFF MANAGEMENT
// ============================================

const createTariffSchema = z.object({
    serviceType: z.enum(['ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL']),
    loadType: z.string(),
    slabStart: z.number().nonnegative(),
    slabEnd: z.number().positive().nullable(),
    ratePerUnit: z.number().positive(),
    fixedCharge: z.number().nonnegative().default(0),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional().nullable(),
});

// Create new tariff
router.post('/tariffs', async (req: AuthReq, res, next) => {
    try {
        const data = createTariffSchema.parse(req.body);

        const tariff = await prisma.tariff.create({
            data: {
                ...data,
                validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
                validTo: data.validTo ? new Date(data.validTo) : null,
            },
        });

        res.status(201).json({
            success: true,
            data: tariff,
            message: 'Tariff created successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Get all tariffs
router.get('/tariffs', async (req: AuthReq, res, next) => {
    try {
        const { serviceType, loadType, isActive } = req.query;

        const where: any = {};
        if (serviceType) where.serviceType = serviceType;
        if (loadType) where.loadType = loadType;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const tariffs = await prisma.tariff.findMany({
            where,
            orderBy: [{ serviceType: 'asc' }, { loadType: 'asc' }, { slabStart: 'asc' }],
        });

        res.json({
            success: true,
            data: tariffs,
        });
    } catch (error) {
        next(error);
    }
});

// Update tariff
router.patch('/tariffs/:id', async (req: AuthReq, res, next) => {
    try {
        const { id } = req.params;
        const updateData = z
            .object({
                ratePerUnit: z.number().positive().optional(),
                fixedCharge: z.number().nonnegative().optional(),
                isActive: z.boolean().optional(),
                validTo: z.string().datetime().nullable().optional(),
            })
            .parse(req.body);

        const tariff = await prisma.tariff.update({
            where: { id },
            data: {
                ...updateData,
                ...(updateData.validTo !== undefined && {
                    validTo: updateData.validTo ? new Date(updateData.validTo) : null,
                }),
            },
        });

        res.json({
            success: true,
            data: tariff,
            message: 'Tariff updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Deactivate tariff
router.delete('/tariffs/:id', async (req: AuthReq, res, next) => {
    try {
        const { id } = req.params;

        const tariff = await prisma.tariff.update({
            where: { id },
            data: {
                isActive: false,
                validTo: new Date(),
            },
        });

        res.json({
            success: true,
            data: tariff,
            message: 'Tariff deactivated successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
