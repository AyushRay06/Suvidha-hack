-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GrievancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BILL_DUE', 'PAYMENT_SUCCESS', 'OUTAGE_ALERT', 'GRIEVANCE_UPDATE', 'SERVICE_UPDATE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "GasProvider" AS ENUM ('INDANE', 'HP_GAS', 'BHARAT_GAS');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('STREETLIGHT', 'ROAD_REPAIR', 'DRAINAGE', 'SANITATION', 'WATER_SUPPLY', 'GARBAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GuaranteeStatus" AS ENUM ('GUARANTEED', 'NOT_GUARANTEED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SIGMRequestType" AS ENUM ('BILL_PAYMENT', 'NEW_CONNECTION', 'COMPLAINT_REGISTRATION', 'DOCUMENT_REQUEST', 'METER_READING');

-- CreateEnum
CREATE TYPE "BackendActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "aadhaarHash" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "language" TEXT NOT NULL DEFAULT 'en',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "kioskId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "connectionNo" TEXT NOT NULL,
    "meterNo" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "sanctionedLoad" DOUBLE PRECISION,
    "loadType" TEXT,
    "phase" TEXT,
    "provider" "GasProvider",
    "agency" TEXT,
    "cylinders" INTEGER DEFAULT 1,
    "connectionDate" TIMESTAMP(3),
    "lastReadingDate" TIMESTAMP(3),
    "lastReading" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "reading" DOUBLE PRECISION NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "unitsConsumed" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "gatewayResponse" JSONB,
    "receiptNo" TEXT,
    "receiptUrl" TEXT,
    "kioskId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "ticketNo" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "GrievancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "GrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceTimeline" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "titleHi" TEXT,
    "message" TEXT NOT NULL,
    "messageHi" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "title" TEXT NOT NULL,
    "titleHi" TEXT,
    "message" TEXT NOT NULL,
    "messageHi" TEXT,
    "affectedArea" TEXT,
    "severity" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grievanceId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceConnectionId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kiosk" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "lastPingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kiosk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KioskLog" (
    "id" TEXT NOT NULL,
    "kioskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KioskLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "loadType" TEXT NOT NULL,
    "slabStart" DOUBLE PRECISION NOT NULL,
    "slabEnd" DOUBLE PRECISION,
    "ratePerUnit" DOUBLE PRECISION NOT NULL,
    "fixedCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GasBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "deliveryDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "subsidyAmount" DOUBLE PRECISION DEFAULT 0,
    "otp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GasBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL DEFAULT 'RESIDENTIAL',
    "address" TEXT NOT NULL,
    "ward" TEXT,
    "area" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyTax" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "receiptNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CivicComplaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "complaintNo" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "priority" "GrievancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivicComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "type" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "category" TEXT,
    "data" JSONB NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SIGMLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kioskId" TEXT,
    "requestType" "SIGMRequestType" NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "guaranteeStatus" "GuaranteeStatus" NOT NULL,
    "blockingReasons" JSONB,
    "checkDetails" JSONB,
    "citizenAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "requestSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SIGMLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "requestType" "SIGMRequestType" NOT NULL,
    "lockKey" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RequestLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackendActionQueue" (
    "id" TEXT NOT NULL,
    "sigmLogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "requestType" "SIGMRequestType" NOT NULL,
    "actionRequired" TEXT NOT NULL,
    "actionRequiredHi" TEXT,
    "actionDetails" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" "BackendActionStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackendActionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceConnection_connectionNo_key" ON "ServiceConnection"("connectionNo");

-- CreateIndex
CREATE INDEX "ServiceConnection_userId_idx" ON "ServiceConnection"("userId");

-- CreateIndex
CREATE INDEX "ServiceConnection_connectionNo_idx" ON "ServiceConnection"("connectionNo");

-- CreateIndex
CREATE INDEX "ServiceConnection_serviceType_idx" ON "ServiceConnection"("serviceType");

-- CreateIndex
CREATE INDEX "MeterReading_connectionId_idx" ON "MeterReading"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNo_key" ON "Bill"("billNo");

-- CreateIndex
CREATE INDEX "Bill_userId_idx" ON "Bill"("userId");

-- CreateIndex
CREATE INDEX "Bill_connectionId_idx" ON "Bill"("connectionId");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE INDEX "Bill_dueDate_idx" ON "Bill"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNo_key" ON "Payment"("receiptNo");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_billId_idx" ON "Payment"("billId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Grievance_ticketNo_key" ON "Grievance"("ticketNo");

-- CreateIndex
CREATE INDEX "Grievance_userId_idx" ON "Grievance"("userId");

-- CreateIndex
CREATE INDEX "Grievance_ticketNo_idx" ON "Grievance"("ticketNo");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE INDEX "Grievance_serviceType_idx" ON "Grievance"("serviceType");

-- CreateIndex
CREATE INDEX "GrievanceTimeline_grievanceId_idx" ON "GrievanceTimeline"("grievanceId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "SystemAlert_serviceType_idx" ON "SystemAlert"("serviceType");

-- CreateIndex
CREATE INDEX "SystemAlert_isActive_idx" ON "SystemAlert"("isActive");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_grievanceId_idx" ON "Document"("grievanceId");

-- CreateIndex
CREATE INDEX "Kiosk_isOnline_idx" ON "Kiosk"("isOnline");

-- CreateIndex
CREATE INDEX "KioskLog_kioskId_idx" ON "KioskLog"("kioskId");

-- CreateIndex
CREATE INDEX "KioskLog_createdAt_idx" ON "KioskLog"("createdAt");

-- CreateIndex
CREATE INDEX "Tariff_serviceType_loadType_isActive_idx" ON "Tariff"("serviceType", "loadType", "isActive");

-- CreateIndex
CREATE INDEX "Job_status_scheduledAt_idx" ON "Job"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Job_type_idx" ON "Job"("type");

-- CreateIndex
CREATE UNIQUE INDEX "GasBooking_bookingId_key" ON "GasBooking"("bookingId");

-- CreateIndex
CREATE INDEX "GasBooking_userId_idx" ON "GasBooking"("userId");

-- CreateIndex
CREATE INDEX "GasBooking_connectionId_idx" ON "GasBooking"("connectionId");

-- CreateIndex
CREATE INDEX "GasBooking_status_idx" ON "GasBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyId_key" ON "Property"("propertyId");

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "Property_propertyId_idx" ON "Property"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyTax_propertyId_idx" ON "PropertyTax"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyTax_status_idx" ON "PropertyTax"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyTax_propertyId_financialYear_key" ON "PropertyTax"("propertyId", "financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "CivicComplaint_complaintNo_key" ON "CivicComplaint"("complaintNo");

-- CreateIndex
CREATE INDEX "CivicComplaint_userId_idx" ON "CivicComplaint"("userId");

-- CreateIndex
CREATE INDEX "CivicComplaint_complaintNo_idx" ON "CivicComplaint"("complaintNo");

-- CreateIndex
CREATE INDEX "CivicComplaint_category_idx" ON "CivicComplaint"("category");

-- CreateIndex
CREATE INDEX "CivicComplaint_status_idx" ON "CivicComplaint"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_userId_idx" ON "ServiceRequest"("userId");

-- CreateIndex
CREATE INDEX "ServiceRequest_connectionId_idx" ON "ServiceRequest"("connectionId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_type_idx" ON "ServiceRequest"("type");

-- CreateIndex
CREATE INDEX "SIGMLog_userId_idx" ON "SIGMLog"("userId");

-- CreateIndex
CREATE INDEX "SIGMLog_createdAt_idx" ON "SIGMLog"("createdAt");

-- CreateIndex
CREATE INDEX "SIGMLog_guaranteeStatus_idx" ON "SIGMLog"("guaranteeStatus");

-- CreateIndex
CREATE INDEX "SIGMLog_requestType_idx" ON "SIGMLog"("requestType");

-- CreateIndex
CREATE INDEX "SIGMLog_serviceType_idx" ON "SIGMLog"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "RequestLock_lockKey_key" ON "RequestLock"("lockKey");

-- CreateIndex
CREATE INDEX "RequestLock_userId_idx" ON "RequestLock"("userId");

-- CreateIndex
CREATE INDEX "RequestLock_lockKey_idx" ON "RequestLock"("lockKey");

-- CreateIndex
CREATE INDEX "RequestLock_isActive_idx" ON "RequestLock"("isActive");

-- CreateIndex
CREATE INDEX "RequestLock_expiresAt_idx" ON "RequestLock"("expiresAt");

-- CreateIndex
CREATE INDEX "BackendActionQueue_userId_idx" ON "BackendActionQueue"("userId");

-- CreateIndex
CREATE INDEX "BackendActionQueue_status_idx" ON "BackendActionQueue"("status");

-- CreateIndex
CREATE INDEX "BackendActionQueue_priority_idx" ON "BackendActionQueue"("priority");

-- CreateIndex
CREATE INDEX "BackendActionQueue_scheduledFor_idx" ON "BackendActionQueue"("scheduledFor");

-- CreateIndex
CREATE INDEX "BackendActionQueue_sigmLogId_idx" ON "BackendActionQueue"("sigmLogId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceConnection" ADD CONSTRAINT "ServiceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ServiceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ServiceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ServiceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceTimeline" ADD CONSTRAINT "GrievanceTimeline_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_serviceConnectionId_fkey" FOREIGN KEY ("serviceConnectionId") REFERENCES "ServiceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KioskLog" ADD CONSTRAINT "KioskLog_kioskId_fkey" FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasBooking" ADD CONSTRAINT "GasBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GasBooking" ADD CONSTRAINT "GasBooking_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ServiceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTax" ADD CONSTRAINT "PropertyTax_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CivicComplaint" ADD CONSTRAINT "CivicComplaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ServiceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIGMLog" ADD CONSTRAINT "SIGMLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLock" ADD CONSTRAINT "RequestLock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackendActionQueue" ADD CONSTRAINT "BackendActionQueue_sigmLogId_fkey" FOREIGN KEY ("sigmLogId") REFERENCES "SIGMLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackendActionQueue" ADD CONSTRAINT "BackendActionQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
