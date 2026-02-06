import { prisma } from '@suvidha/database';
import { TariffService } from './tariff.service';

export class BillGeneratorService {
    /**
     * Generate bill from meter reading
     */
    static async generateBillFromReading(meterReadingId: string) {
        // Get meter reading with connection details
        const meterReading = await prisma.meterReading.findUnique({
            where: { id: meterReadingId },
            include: {
                connection: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!meterReading) {
            throw new Error(`Meter reading ${meterReadingId} not found`);
        }

        const connection = meterReading.connection;

        // Check if connection has loadType
        if (!connection.loadType) {
            throw new Error(`Connection ${connection.id} does not have loadType set`);
        }

        // Get previous reading to calculate consumption
        const previousReading = await prisma.meterReading.findFirst({
            where: {
                connectionId: connection.id,
                readingDate: { lt: meterReading.readingDate },
            },
            orderBy: { readingDate: 'desc' },
        });

        const previousValue = previousReading?.reading || 0;
        const unitsConsumed = meterReading.reading - previousValue;

        if (unitsConsumed <= 0) {
            throw new Error(`Invalid consumption: ${unitsConsumed} units`);
        }

        // Calculate bill using tariff service
        const calculation = await TariffService.calculateBill(
            unitsConsumed,
            connection.loadType
        );

        // Generate bill number
        const billNo = `ELEC-${Date.now()}-${connection.connectionNo.slice(-4)}`;

        // Calculate period (assume monthly billing)
        const periodFrom = previousReading?.readingDate || new Date(meterReading.readingDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const periodTo = meterReading.readingDate;

        // Calculate due date (15 days from bill date)
        const dueDate = new Date(meterReading.readingDate);
        dueDate.setDate(dueDate.getDate() + 15);

        // Create bill
        const bill = await prisma.bill.create({
            data: {
                userId: connection.userId,
                connectionId: connection.id,
                billNo,
                billDate: meterReading.readingDate,
                periodFrom,
                periodTo,
                dueDate,
                unitsConsumed,
                amount: calculation.fixedCharge,
                totalAmount: calculation.totalAmount,
                status: 'PENDING',
                amountPaid: 0,
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: connection.userId,
                type: 'BILL_GENERATED',
                title: 'New Electricity Bill Generated',
                titleHi: 'नया बिजली बिल जेनरेट हुआ',
                message: `Your electricity bill for ${unitsConsumed} units is ₹${calculation.totalAmount}. Bill No: ${billNo}. Due date: ${dueDate.toLocaleDateString()}`,
                messageHi: `${unitsConsumed} यूनिट के लिए आपका बिजली बिल ₹${calculation.totalAmount} है। बिल नंबर: ${billNo}। देय तिथि: ${dueDate.toLocaleDateString()}`,
                data: { billId: bill.id, billNo },
            },
        });

        return {
            bill,
            calculation,
        };
    }

    /**
     * Generate bills for all pending meter readings
     */
    static async generatePendingBills() {
        // Find meter readings that don't have associated bills
        const pendingReadings = await prisma.meterReading.findMany({
            where: {
                connection: {
                    serviceType: 'ELECTRICITY',
                    status: 'ACTIVE',
                },
            },
            include: {
                connection: true,
            },
        });

        const results = [];

        for (const reading of pendingReadings) {
            // Check if bill already exists for this reading
            const existingBill = await prisma.bill.findFirst({
                where: {
                    connectionId: reading.connectionId,
                    periodTo: { gte: reading.readingDate },
                },
            });

            if (!existingBill) {
                try {
                    const result = await this.generateBillFromReading(reading.id);
                    results.push({ success: true, readingId: reading.id, billId: result.bill.id });
                } catch (error: any) {
                    results.push({ success: false, readingId: reading.id, error: error.message });
                }
            }
        }

        return results;
    }
}
