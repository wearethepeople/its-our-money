-- AlterTable
ALTER TABLE "participant" ADD COLUMN "firstLookCompletedAt" DATETIME;

-- Backfill existing participants as having already completed the first-look
-- funnel, so only newly-created participants go through it.
UPDATE "participant" SET "firstLookCompletedAt" = "createdAt" WHERE "firstLookCompletedAt" IS NULL;
