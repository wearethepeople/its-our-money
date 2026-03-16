-- CreateTable
CREATE TABLE "RecoveryToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "verifierHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "RecoveryToken_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryToken_participantId_key" ON "RecoveryToken"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryToken_selector_key" ON "RecoveryToken"("selector");

-- CreateIndex
CREATE INDEX "RecoveryToken_participantId_idx" ON "RecoveryToken"("participantId");
