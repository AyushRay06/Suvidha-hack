import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suvidha/database";

export async function GET(req: NextRequest) {
    try {
        // Get limit from query params
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "10");

        // Fetch recent activities from different sources
        const [meterReadings, payments, grievances] = await Promise.all([
            // Recent meter readings
            prisma.meterReading.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { name: true },
                    },
                },
            }),
            // Recent payments
            prisma.payment.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                where: { status: "SUCCESS" },
                include: {
                    user: {
                        select: { name: true },
                    },
                    bill: {
                        include: {
                            connection: {
                                select: { serviceType: true },
                            },
                        },
                    },
                },
            }),
            // Recent grievances
            prisma.grievance.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { name: true },
                    },
                },
            }),
        ]);

        // Transform and combine activities
        const activities = [
            ...meterReadings.map((reading) => ({
                id: reading.id,
                type: "METER_READING",
                description: `Meter reading submitted: ${reading.reading} units`,
                user: reading.user.name,
                kioskId: "WEB",
                timestamp: reading.createdAt.toISOString(),
                serviceType: reading.serviceType,
            })),
            ...payments.map((payment) => ({
                id: payment.id,
                type: "PAYMENT",
                description: `Bill payment of ₹${payment.amount.toLocaleString()}`,
                user: payment.user.name,
                kioskId: payment.kioskId || "WEB",
                timestamp: payment.createdAt.toISOString(),
                serviceType: payment.bill.connection.serviceType,
            })),
            ...grievances.map((grievance) => ({
                id: grievance.id,
                type: "GRIEVANCE",
                description: `${grievance.category}: ${grievance.subject}`,
                user: grievance.user.name,
                kioskId: grievance.kioskId || "WEB",
                timestamp: grievance.createdAt.toISOString(),
                serviceType: grievance.serviceType,
            })),
        ];

        // Sort by timestamp and limit
        const sortedActivities = activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);

        return NextResponse.json({
            success: true,
            data: sortedActivities,
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        );
    }
}
