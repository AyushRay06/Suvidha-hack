import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@suvidha/database';
import { authenticate, AuthRequest as AuthReq } from '../../middleware/auth';
import { ApiError } from '../../middleware/errorHandler';
import { MunicipalService } from './municipal.service';

const router = Router();

router.use(authenticate);

// ============================================
// PROPERTIES
// ============================================

router.get('/properties', async (req: AuthReq, res, next) => {
    try {
        const properties = await prisma.property.findMany({
            where: { userId: req.user!.id },
            include: {
                taxRecords: {
                    orderBy: { financialYear: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: properties,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/tax/:propertyId', async (req: AuthReq, res, next) => {
    try {
        const { propertyId } = req.params;

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                userId: req.user!.id,
            },
            include: {
                taxRecords: {
                    orderBy: { financialYear: 'desc' },
                },
            },
        });

        if (!property) {
            throw new ApiError('Property not found', 404);
        }

        res.json({
            success: true,
            data: property,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// PROPERTY TAX PAYMENT
// ============================================

const payTaxSchema = z.object({
    propertyId: z.string(),
    financialYear: z.string(),
    amount: z.number().positive(),
});

router.post('/tax/pay', async (req: AuthReq, res, next) => {
    try {
        const { propertyId, financialYear, amount } = payTaxSchema.parse(req.body);

        const property = await prisma.property.findFirst({
            where: { id: propertyId, userId: req.user!.id },
        });

        if (!property) {
            throw new ApiError('Property not found', 404);
        }

        const taxRecord = await prisma.propertyTax.findUnique({
            where: {
                propertyId_financialYear: { propertyId, financialYear },
            },
        });

        if (!taxRecord) {
            throw new ApiError('Tax record not found for this year', 404);
        }

        const receiptNo = `TAX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const updatedTax = await prisma.propertyTax.update({
            where: { id: taxRecord.id },
            data: {
                amountPaid: { increment: amount },
                status: amount >= taxRecord.totalAmount - taxRecord.amountPaid ? 'PAID' : 'PARTIAL',
                paidAt: new Date(),
                receiptNo,
            },
        });

        res.json({
            success: true,
            data: updatedTax,
            message: 'Payment recorded successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// CIVIC COMPLAINTS
// ============================================

const createComplaintSchema = z.object({
    category: z.enum(['STREETLIGHT', 'ROAD_REPAIR', 'DRAINAGE', 'SANITATION', 'WATER_SUPPLY', 'GARBAGE', 'OTHER']),
    subject: z.string().min(5),
    description: z.string().min(5),
    location: z.string().min(3),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    imageUrl: z.string().optional(), // Allow relative paths like /uploads/filename.jpg
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});


router.post('/complaints', async (req: AuthReq, res, next) => {
    try {
        const data = createComplaintSchema.parse(req.body);

        const complaintNo = `CMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const complaint = await prisma.civicComplaint.create({
            data: {
                userId: req.user!.id,
                complaintNo,
                category: data.category,
                subject: data.subject,
                description: data.description,
                location: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                imageUrl: data.imageUrl,
                priority: data.priority || 'MEDIUM',
            },
        });

        res.status(201).json({
            success: true,
            data: complaint,
            message: 'Complaint registered successfully',
        });
    } catch (error) {
        next(error);
    }
});

router.get('/complaints', async (req: AuthReq, res, next) => {
    try {
        const { status, category } = req.query;

        const complaints = await prisma.civicComplaint.findMany({
            where: {
                userId: req.user!.id,
                ...(status && { status: status as any }),
                ...(category && { category: category as any }),
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: complaints,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/complaints/:id', async (req: AuthReq, res, next) => {
    try {
        const { id } = req.params;

        const complaint = await prisma.civicComplaint.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
        });

        if (!complaint) {
            throw new ApiError('Complaint not found', 404);
        }

        res.json({
            success: true,
            data: complaint,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// WASTE COLLECTION
// ============================================

router.get('/waste-schedule', async (req: AuthReq, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { pincode: true, address: true },
        });

        // Generate mock schedule based on ward/pincode
        const schedule = MunicipalService.getWasteSchedule(user?.pincode || '781001');

        res.json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
});

const reportMissedSchema = z.object({
    date: z.string(),
    wasteType: z.enum(['DRY', 'WET', 'BOTH']),
    notes: z.string().optional(),
});

router.post('/waste/report', async (req: AuthReq, res, next) => {
    try {
        const { date, wasteType, notes } = reportMissedSchema.parse(req.body);

        // Create as a civic complaint
        const complaintNo = `WC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const complaint = await prisma.civicComplaint.create({
            data: {
                userId: req.user!.id,
                complaintNo,
                category: 'GARBAGE',
                subject: `Missed Waste Collection - ${wasteType}`,
                description: notes || `Waste collection was missed on ${date}. Waste type: ${wasteType}`,
                location: req.user!.address || 'Unknown',
                priority: 'MEDIUM',
            },
        });

        res.status(201).json({
            success: true,
            data: complaint,
            message: 'Missed collection reported successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
