-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_UPCOMING', 'REGISTRATION_CONFIRMED', 'PAYMENT_STATUS', 'INVITATION_RECEIVED', 'SYSTEM_ALERT');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM_ALERT';

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
