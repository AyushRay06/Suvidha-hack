import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { connectionId, reading, photoUrl } = body;

        if (!connectionId || !reading) {
            return NextResponse.json(
                { error: "Connection ID and reading are required" },
                { status: 400 }
            );
        }

        // Fetch connection details
        const connection = await prisma.serviceConnection.findUnique({
            where: { id: connectionId },
            include: {
                user: true,
            },
        });

        if (!connection) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        // Verify user owns this connection
        if (connection.userId !== decoded.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get previous reading
        const previousReading = await prisma.meterReading.findFirst({
            where: {
                connectionId,
                status: "VERIFIED",
            },
            orderBy: {
                readingDate: "desc",
            },
        });

        const previousValue = previousReading?.reading || 0;
        const consumption = parseFloat(reading) - previousValue;

        // Create meter reading
        const meterReading = await prisma.meterReading.create({
            data: {
                connectionId,
                userId: decoded.userId,
                serviceType: connection.serviceType,
                reading: parseFloat(reading),
                previousReading: previousValue,
                consumption,
                submittedBy: "CITIZEN",
                photoUrl: photoUrl || null,
                status: "PENDING",
                isVerified: false,
            },
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
        });

        return NextResponse.json({
            success: true,
            data: meterReading,
        });
    } catch (error) {
        console.error("Error creating meter reading:", error);
        return NextResponse.json(
            { error: "Failed to create meter reading" },
            { status: 500 }
        );
    }
}
