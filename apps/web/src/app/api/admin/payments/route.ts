import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suvidha/database";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status");
        const serviceType = searchParams.get("serviceType");

        // Build where clause
        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        }

        // Fetch payments with user and bill details
        const payments = await prisma.payment.findMany({
            where,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                bill: {
                    select: {
                        billNo: true,
                        connection: {
                            select: {
                                connectionNo: true,
                                serviceType: true,
                            },
                        },
                    },
                },
            },
        });

        // Filter by service type if specified (since it's nested)
        let filteredPayments = payments;
        if (serviceType && serviceType !== "all") {
            filteredPayments = payments.filter(
                (p) => p.bill?.connection?.serviceType === serviceType
            );
        }

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const successPayments = await prisma.payment.findMany({
            where: { status: "SUCCESS" },
            select: {
                amount: true,
                createdAt: true,
            },
        });

        const todayPayments = successPayments.filter(
            (p) => p.createdAt >= today
        );
        const weekPayments = successPayments.filter(
            (p) => p.createdAt >= weekAgo
        );
        const monthPayments = successPayments.filter(
            (p) => p.createdAt >= monthStart
        );

        const stats = {
            todayTotal: todayPayments.reduce((sum, p) => sum + p.amount, 0),
            todayCount: todayPayments.length,
            weekTotal: weekPayments.reduce((sum, p) => sum + p.amount, 0),
            weekCount: weekPayments.length,
            monthTotal: monthPayments.reduce((sum, p) => sum + p.amount, 0),
            monthCount: monthPayments.length,
        };

        // Transform payments to match frontend interface
        const transformedPayments = filteredPayments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            transactionId: payment.transactionId || `TXN-${payment.id.slice(0, 8)}`,
            receiptNo: payment.receiptNo || "",
            paidAt: payment.paidAt?.toISOString() || "",
            createdAt: payment.createdAt.toISOString(),
            user: {
                name: payment.user.name || "Unknown",
                phone: payment.user.phone || "N/A",
            },
            bill: {
                billNo: payment.bill?.billNo || "N/A",
                serviceType: payment.bill?.connection?.serviceType || "UNKNOWN",
                connection: {
                    connectionNo: payment.bill?.connection?.connectionNo || "N/A",
                },
            },
        }));

        return NextResponse.json({
            success: true,
            data: {
                payments: transformedPayments,
                stats,
            },
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch payments",
            },
            { status: 500 }
        );
    }
}
