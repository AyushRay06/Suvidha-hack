import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test user
  const user = await prisma.user.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      phone: "9876543210",
      name: "Demo User",
      email: "demo@suvidha.gov.in",
      address: "123 Gandhi Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      language: "en",
      isVerified: true,
      role: "CITIZEN",
    },
  });
  console.log(`✅ Created user: ${user.name} (${user.phone})`);

  // Create service connections
  const connections = await Promise.all([
    prisma.serviceConnection.upsert({
      where: { connectionNo: "ELEC-2024-001234" },
      update: {
        loadType: "RESIDENTIAL",
        phase: "SINGLE",
        sanctionedLoad: 5.0,
      },
      create: {
        userId: user.id,
        serviceType: "ELECTRICITY",
        connectionNo: "ELEC-2024-001234",
        meterNo: "MTR-98765",
        address: "123 Gandhi Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        status: "ACTIVE",
        connectionDate: new Date("2023-01-15"),
        loadType: "RESIDENTIAL",
        phase: "SINGLE",
        sanctionedLoad: 5.0,
      },
    }),
    prisma.serviceConnection.upsert({
      where: { connectionNo: "WATER-2024-005678" },
      update: {},
      create: {
        userId: user.id,
        serviceType: "WATER",
        connectionNo: "WATER-2024-005678",
        meterNo: "WTR-54321",
        address: "123 Gandhi Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        status: "ACTIVE",
        connectionDate: new Date("2023-02-20"),
      },
    }),
    prisma.serviceConnection.upsert({
      where: { connectionNo: "GAS-2024-009012" },
      update: {},
      create: {
        userId: user.id,
        serviceType: "GAS",
        connectionNo: "GAS-2024-009012",
        address: "123 Gandhi Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        status: "ACTIVE",
        connectionDate: new Date("2023-03-10"),
      },
    }),
  ]);
  console.log(`✅ Created ${connections.length} service connections`);

  // Create bills
  const now = new Date();
  const bills = await Promise.all([
    prisma.bill.upsert({
      where: { billNo: "BILL-ELEC-2024-0001" },
      update: {},
      create: {
        connectionId: connections[0].id,
        userId: user.id,
        billNo: "BILL-ELEC-2024-0001",
        billDate: new Date("2024-01-01"),
        periodFrom: new Date("2024-01-01"),
        periodTo: new Date("2024-01-31"),
        amount: 2450.0,
        totalAmount: 2450.0,
        dueDate: new Date("2024-02-15"),
        status: "UNPAID",
        unitsConsumed: 245,
      },
    }),
    prisma.bill.upsert({
      where: { billNo: "BILL-WATER-2024-0001" },
      update: {},
      create: {
        connectionId: connections[1].id,
        userId: user.id,
        billNo: "BILL-WATER-2024-0001",
        billDate: new Date("2024-01-01"),
        periodFrom: new Date("2024-01-01"),
        periodTo: new Date("2024-01-31"),
        amount: 850.0,
        totalAmount: 850.0,
        dueDate: new Date("2024-02-20"),
        status: "UNPAID",
        unitsConsumed: 15000,
      },
    }),
    prisma.bill.upsert({
      where: { billNo: "BILL-GAS-2024-0001" },
      update: {},
      create: {
        connectionId: connections[2].id,
        userId: user.id,
        billNo: "BILL-GAS-2024-0001",
        billDate: new Date("2024-01-01"),
        periodFrom: new Date("2024-01-01"),
        periodTo: new Date("2024-01-31"),
        amount: 1200.0,
        totalAmount: 1200.0,
        dueDate: new Date("2024-02-10"),
        status: "OVERDUE",
      },
    }),
    prisma.bill.upsert({
      where: { billNo: "BILL-ELEC-2023-0012" },
      update: {},
      create: {
        connectionId: connections[0].id,
        userId: user.id,
        billNo: "BILL-ELEC-2023-0012",
        billDate: new Date("2023-12-01"),
        periodFrom: new Date("2023-12-01"),
        periodTo: new Date("2023-12-31"),
        amount: 2100.0,
        totalAmount: 2100.0,
        amountPaid: 2100.0,
        dueDate: new Date("2024-01-15"),
        status: "PAID",
        unitsConsumed: 210,
      },
    }),
  ]);
  console.log(`✅ Created ${bills.length} bills`);

  // Create a grievance
  const grievance = await prisma.grievance.upsert({
    where: { ticketNo: "GRV-2024-000001" },
    update: {},
    create: {
      userId: user.id,
      serviceType: "ELECTRICITY",
      ticketNo: "GRV-2024-000001",
      category: "Power Outage",
      subject: "Frequent power cuts in sector 5",
      description: "We are experiencing frequent power cuts lasting 2-3 hours daily for the past week.",
      priority: "HIGH",
      status: "IN_PROGRESS",
    },
  });
  console.log(`✅ Created grievance: ${grievance.ticketNo}`);

  // Create notifications
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: user.id,
        title: "Bill Due Soon",
        titleHi: "बिल जल्द देय है",
        message: "Your electricity bill of ₹2,450 is due on Feb 15, 2024",
        messageHi: "आपका बिजली बिल ₹2,450 का भुगतान 15 फरवरी 2024 तक करना है",
        type: "BILL_DUE",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Scheduled Maintenance",
        titleHi: "अनुसूचित रखरखाव",
        message: "Water supply will be interrupted on Feb 5, 2024 from 10 AM to 2 PM",
        messageHi: "5 फरवरी 2024 को सुबह 10 बजे से दोपहर 2 बजे तक पानी की आपूर्ति बाधित रहेगी",
        type: "SERVICE_UPDATE",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Grievance Update",
        titleHi: "शिकायत अपडेट",
        message: "Your complaint GRV-2024-000001 is now being processed",
        messageHi: "आपकी शिकायत GRV-2024-000001 पर कार्रवाई की जा रही है",
        type: "GRIEVANCE_UPDATE",
        isRead: true,
      },
    ],
  });
  console.log("✅ Created notifications");

  // Create system alerts
  await prisma.systemAlert.create({
    data: {
      title: "Gas Pipeline Maintenance",
      titleHi: "गैस पाइपलाइन रखरखाव",
      message: "Planned maintenance in Zone 3 on Feb 8, 2024",
      messageHi: "8 फरवरी 2024 को ज़ोन 3 में नियोजित रखरखाव",
      severity: "info",
      serviceType: "GAS",
      isActive: true,
      startsAt: new Date(),
    },
  });
  console.log("✅ Created system alerts");

  // Create electricity tariffs - Assam 2025 Rates (APDCL)
  const tariffs = [
    // Residential/Domestic Tariffs (Assam April 2025)
    // 0-120 units: ₹4.90/unit + ₹0.69 FPPPA = ₹5.59/unit effective
    { serviceType: 'ELECTRICITY', loadType: 'RESIDENTIAL', slabStart: 0, slabEnd: 120, ratePerUnit: 4.90, fixedCharge: 60 },
    // 121-240 units: ₹6.30/unit + ₹0.69 FPPPA = ₹6.99/unit effective  
    { serviceType: 'ELECTRICITY', loadType: 'RESIDENTIAL', slabStart: 120, slabEnd: 240, ratePerUnit: 6.30, fixedCharge: 60 },
    // Above 240 units: ₹7.50/unit + ₹0.69 FPPPA = ₹8.19/unit effective
    { serviceType: 'ELECTRICITY', loadType: 'RESIDENTIAL', slabStart: 240, slabEnd: null, ratePerUnit: 7.50, fixedCharge: 60 },

    // Commercial Tariffs (Reduced by 25 paisa from ₹8.60)
    { serviceType: 'ELECTRICITY', loadType: 'COMMERCIAL', slabStart: 0, slabEnd: 500, ratePerUnit: 8.35, fixedCharge: 150 },
    { serviceType: 'ELECTRICITY', loadType: 'COMMERCIAL', slabStart: 500, slabEnd: null, ratePerUnit: 9.50, fixedCharge: 150 },

    // Industrial Tariffs
    { serviceType: 'ELECTRICITY', loadType: 'INDUSTRIAL', slabStart: 0, slabEnd: 1000, ratePerUnit: 7.00, fixedCharge: 200 },
    { serviceType: 'ELECTRICITY', loadType: 'INDUSTRIAL', slabStart: 1000, slabEnd: null, ratePerUnit: 8.00, fixedCharge: 200 },
  ];

  for (const tariff of tariffs) {
    await prisma.tariff.create({ data: tariff as any });
  }
  console.log(`✅ Created ${tariffs.length} electricity tariffs (Assam 2025 rates)`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Login:");
  console.log("   Phone: 9876543210");
  console.log("   OTP: 123456 (mock OTP always works in dev mode)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
