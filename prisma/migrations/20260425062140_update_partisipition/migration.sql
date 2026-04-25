-- AlterTable
ALTER TABLE "participations" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cardType" TEXT,
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;
