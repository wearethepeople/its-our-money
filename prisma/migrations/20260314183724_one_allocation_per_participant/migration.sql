/*
  Warnings:

  - You are about to drop the `Participant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `fiscalYear` on the `participant_allocations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Session_participantId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Participant";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expirationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "participantId" TEXT NOT NULL,
    CONSTRAINT "session_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_participant_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "participant_allocations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_participant_allocations" ("createdAt", "id", "participantId", "updatedAt") SELECT "createdAt", "id", "participantId", "updatedAt" FROM "participant_allocations";
DROP TABLE "participant_allocations";
ALTER TABLE "new_participant_allocations" RENAME TO "participant_allocations";
CREATE UNIQUE INDEX "participant_allocations_participantId_key" ON "participant_allocations"("participantId");
CREATE INDEX "participant_allocations_participantId_idx" ON "participant_allocations"("participantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "session_participantId_idx" ON "session"("participantId");
