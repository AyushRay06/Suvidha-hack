/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `MeterReading` table. All the data in the column will be lost.
  - Added the required column `serviceType` to the `MeterReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MeterReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `MeterReading` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'BILLED');

-- AlterTable
ALTER TABLE "MeterReading" DROP COLUMN "imageUrl",
ADD COLUMN     "billGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consumption" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "previousReading" DOUBLE PRECISION,
ADD COLUMN     "serviceType" "ServiceType" NOT NULL,
ADD COLUMN     "status" "ReadingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ALTER COLUMN "readingDate" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "MeterReading_userId_idx" ON "MeterReading"("userId");

-- CreateIndex
CREATE INDEX "MeterReading_serviceType_idx" ON "MeterReading"("serviceType");

-- CreateIndex
CREATE INDEX "MeterReading_status_idx" ON "MeterReading"("status");

-- CreateIndex
CREATE INDEX "MeterReading_readingDate_idx" ON "MeterReading"("readingDate");

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
