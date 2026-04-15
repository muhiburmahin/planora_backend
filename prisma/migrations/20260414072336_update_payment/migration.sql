-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bankTranId" TEXT,
ADD COLUMN     "ipnResponse" JSONB,
ADD COLUMN     "storeAmount" DOUBLE PRECISION,
ADD COLUMN     "valId" TEXT,
ADD COLUMN     "verifySign" TEXT;
