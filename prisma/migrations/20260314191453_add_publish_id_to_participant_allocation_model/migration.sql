/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `participant_allocations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "participant_allocations" ADD COLUMN "publicId" TEXT;
ALTER TABLE "participant_allocations" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "participant_allocations" ADD COLUMN "unpublishedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "participant_allocations_publicId_key" ON "participant_allocations"("publicId");
