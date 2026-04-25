/*
  Warnings:

  - You are about to drop the column `bankTranId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `cardType` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `ipnResponse` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `storeAmount` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `valId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `verifySign` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[participationId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentIntentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_transactionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "bankTranId",
DROP COLUMN "cardType",
DROP COLUMN "ipnResponse",
DROP COLUMN "storeAmount",
DROP COLUMN "transactionId",
DROP COLUMN "valId",
DROP COLUMN "verifySign",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "paymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_participationId_key" ON "payments"("participationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentIntentId_key" ON "payments"("paymentIntentId");
