import { prisma } from '@suvidha/database';
import { ApiError } from '../../middleware/errorHandler';

export class GasService {
    /**
     * Book a gas cylinder refill
     */
    async bookRefill(userId: string, connectionId: string, amount: number) {
        // 1. Verify connection
        const connection = await prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId,
                serviceType: 'GAS',
            },
        });

        if (!connection) {
            throw new ApiError('Gas connection not found', 404);
        }

        // 2. Check for active bookings (prevent double booking)
        const activeBooking = await prisma.gasBooking.findFirst({
            where: {
                connectionId,
                status: {
                    in: ['BOOKED', 'DISPATCHED', 'OUT_FOR_DELIVERY'],
                },
            },
        });

        if (activeBooking) {
            throw new ApiError('You already have an active booking', 400);
        }

        // 3. Calculate subsidy (Mock logic)
        // Random subsidy between 0 and 200 for demo
        const subsidyAmount = Math.floor(Math.random() * 200);

        // 4. Create booking
        // Generate a booking ID like GAS-YYYY-RANDOM
        const bookingId = `GAS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const booking = await prisma.gasBooking.create({
            data: {
                userId,
                connectionId,
                bookingId,
                amount,
                subsidyAmount,
                status: 'BOOKED',
                // Set delivery date to 3 days from now
                deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
        });

        return booking;
    }

    /**
     * Get booking history for a connection
     */
    async getBookingHistory(userId: string, connectionId?: string) {
        const where: any = { userId };

        if (connectionId) {
            where.connectionId = connectionId;
        }

        const bookings = await prisma.gasBooking.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                connection: {
                    select: {
                        connectionNo: true,
                        provider: true,
                    },
                },
            },
        });

        return bookings;
    }

    /**
     * Get gas connections for user
     */
    async getConnections(userId: string) {
        return prisma.serviceConnection.findMany({
            where: {
                userId,
                serviceType: 'GAS',
            },
        });
    }

    /**
     * Get single gas connection
     */
    async getConnection(userId: string, connectionId: string) {
        return prisma.serviceConnection.findFirst({
            where: {
                id: connectionId,
                userId,
                serviceType: 'GAS',
            },
        });
    }

    /**
     * Submit meter reading for piped gas
     */
    async submitReading(userId: string, connectionId: string, reading: number, imageUrl?: string) {
        const connection = await this.getConnection(userId, connectionId);
        if (!connection) throw new ApiError('Connection not found', 404);

        // Validation
        if (connection.lastReading && reading < connection.lastReading) {
            throw new ApiError('New reading cannot be less than previous reading', 400);
        }

        // Create reading
        const meterReading = await prisma.meterReading.create({
            data: {
                connectionId,
                reading,
                readingDate: new Date(),
                submittedBy: 'CITIZEN',
                userId,
                serviceType: 'GAS',
                photoUrl: imageUrl,
            },
        });

        // Generate Bill
        let bill: any = null;
        if (connection.lastReading !== undefined && connection.lastReading !== null) {
            const units = reading - connection.lastReading;

            // Calculate Amount based on AGCL Tariff
            // Base Rate (Apr 2023): 15.80
            // Apr 2024 (+5%): 16.59
            // Apr 2025 (+5%): 17.42 (Current)
            const baseRate = 17.42;
            const marketingMargin = 0.20; // ₹200/MSCM approx 0.2/SCM

            // Minimum billing for 5 SCM
            const billableUnits = Math.max(units, 5);

            const gasCost = billableUnits * (baseRate + marketingMargin);
            const vat = gasCost * 0.145; // 14.5% VAT
            const totalAmount = Math.round(gasCost + vat);

            if (units >= 0) {
                bill = await prisma.bill.create({
                    data: {
                        userId,
                        connectionId,
                        billNo: `GAS-${Date.now()}`, // Simplified bill no
                        billDate: new Date(),
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
                        periodFrom: connection.lastReadingDate || new Date(),
                        periodTo: new Date(),
                        unitsConsumed: units, // Actual units for record
                        amount: totalAmount,
                        totalAmount: totalAmount,
                        status: 'UNPAID',
                    },
                });
            }
        }

        // Update connection
        await prisma.serviceConnection.update({
            where: { id: connectionId },
            data: {
                lastReading: reading,
                lastReadingDate: new Date(),
            },
        });

        return { meterReading, bill };
    }

    /**
     * Calculate estimated bill
     */
    async calculateBill(units: number) {
        // AGCL Tariff Logic
        const baseRate = 17.42;
        const marketingMargin = 0.20;

        const billableUnits = Math.max(units, 5);
        const gasCost = billableUnits * (baseRate + marketingMargin);
        const vat = gasCost * 0.145;
        const total = Math.round(gasCost + vat);

        return {
            unitsConsumed: units,
            billableUnits,
            ratePerSCM: baseRate + marketingMargin,
            gasCharge: gasCost,
            vat,
            totalAmount: total,
            breakdown: {
                baseRate,
                marketingMargin,
                vatPercent: 14.5
            }
        };
    }
}

export const gasService = new GasService();
