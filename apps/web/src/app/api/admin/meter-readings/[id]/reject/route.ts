import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { verifyToken } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Update meter reading
        const reading = await prisma.meterReading.update({
            where: { id },
            data: {
                status: "REJECTED",
                isVerified: false,
                verifiedBy: decoded.userId,
                verifiedAt: new Date(),
                notes: "Reading rejected by admin",
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
            data: reading,
        });
    } catch (error) {
        console.error("Error rejecting meter reading:", error);
        return NextResponse.json(
            { error: "Failed to reject meter reading" },
            { status: 500 }
        );
    }
}
