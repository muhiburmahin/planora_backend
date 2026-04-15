/*
  Warnings:

  - You are about to drop the column `paymentDetails` on the `participations` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `participations` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `participations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "participations_transactionId_key";

-- AlterTable
ALTER TABLE "participations" DROP COLUMN "paymentDetails",
DROP COLUMN "paymentStatus",
DROP COLUMN "transactionId";

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDetails" JSONB,
    "cardType" TEXT,
    "paidAt" TIMESTAMP(3),
    "participationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
