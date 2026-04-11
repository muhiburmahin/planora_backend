-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
