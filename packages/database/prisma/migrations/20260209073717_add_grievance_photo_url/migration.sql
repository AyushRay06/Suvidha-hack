-- DropIndex
DROP INDEX "Grievance_ticketNo_idx";

-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "kioskId" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_kioskId_fkey" FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
