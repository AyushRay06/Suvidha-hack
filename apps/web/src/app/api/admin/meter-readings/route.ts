import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suvidha/database";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Verify admin/staff role
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        // Build query
        const where: any = {};
        if (status && status !== "ALL") {
            where.status = status;
        }

        // Fetch meter readings
        const readings = await prisma.meterReading.findMany({
            where,
            include: {
                connection: {
                    select: {
                        connectionNo: true,
                        address: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                readingDate: "desc",
            },
            take: 100, // Limit to recent 100 readings
        });

        return NextResponse.json({
            success: true,
            data: readings,
        });
    } catch (error) {
        console.error("Error fetching meter readings:", error);
        return NextResponse.json(
            { error: "Failed to fetch meter readings" },
            { status: 500 }
        );
    }
}
