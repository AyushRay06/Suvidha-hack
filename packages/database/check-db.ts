import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { phone: "9876543210" },
    });

    if (!user) {
        console.log("❌ User not found");
        return;
    }

    console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);

    const connections = await prisma.serviceConnection.findMany({
        where: { userId: user.id },
    });

    console.log(`📊 Found ${connections.length} connections:`);
    connections.forEach((c) => {
        console.log(` - [${c.serviceType}] ${c.connectionNo} (${c.status})`);
    });

    const gasBookings = await prisma.gasBooking.findMany({
        where: { userId: user.id },
    });
    console.log(`🔥 Found ${gasBookings.length} gas bookings`);
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
