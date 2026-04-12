/*
  Warnings:

  - A unique constraint covering the columns `[eventId,receiverId]` on the table `invitations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `invitations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invitations_eventId_receiverId_key" ON "invitations"("eventId", "receiverId");
