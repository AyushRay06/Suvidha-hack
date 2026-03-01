import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suvidha/database";

export async function GET(req: NextRequest) {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch today's meter readings by service type
        const meterReadings = await prisma.meterReading.groupBy({
            by: ["serviceType"],
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _count: {
                id: true,
            },
        });

        // Fetch today's payments with revenue by service type
        const payments = await prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
                status: "SUCCESS",
            },
            include: {
                bill: {
                    select: {
                        connection: {
                            select: { serviceType: true },
                        },
                    },
                },
            },
        });

        // Fetch today's grievances
        const grievances = await prisma.grievance.groupBy({
            by: ["serviceType"],
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            _count: {
                id: true,
            },
        });

        // Calculate revenue by service type
        const revenueByService: Record<string, number> = {};
        payments.forEach((payment) => {
            const serviceType = payment.bill.connection.serviceType;
            revenueByService[serviceType] = (revenueByService[serviceType] || 0) + payment.amount;
        });

        // Build service usage data
        const serviceUsage = {
            ELECTRICITY: {
                count: meterReadings.find((r) => r.serviceType === "ELECTRICITY")?._count.id || 0,
                revenue: Math.round(revenueByService.ELECTRICITY || 0),
            },
            GAS: {
                count: meterReadings.find((r) => r.serviceType === "GAS")?._count.id || 0,
                revenue: Math.round(revenueByService.GAS || 0),
            },
            WATER: {
                count: meterReadings.find((r) => r.serviceType === "WATER")?._count.id || 0,
                revenue: Math.round(revenueByService.WATER || 0),
            },
            MUNICIPAL: {
                count: meterReadings.find((r) => r.serviceType === "MUNICIPAL")?._count.id || 0,
                revenue: Math.round(revenueByService.MUNICIPAL || 0),
            },
            WASTE: {
                count: grievances.filter((g) =>
                    g.serviceType === "MUNICIPAL" || g.serviceType === "WATER"
                ).reduce((sum, g) => sum + g._count.id, 0),
                revenue: 0,
            },
        };

        return NextResponse.json({
            success: true,
            data: serviceUsage,
        });
    } catch (error) {
        console.error("Error fetching service usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch service usage" },
            { status: 500 }
        );
    }
}
