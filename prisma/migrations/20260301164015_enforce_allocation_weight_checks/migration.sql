-- CreateTable
CREATE TABLE "participant_allocations"
(
    "id"            TEXT     NOT NULL PRIMARY KEY,
    "participantId" TEXT     NOT NULL,
    "fiscalYear"    INTEGER  NOT NULL,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     DATETIME NOT NULL,
    CONSTRAINT "participant_allocations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "participant_allocation_items"
(
    "allocationId" TEXT     NOT NULL,
    "categoryCode" TEXT     NOT NULL,
    "weightBps"    INTEGER  NOT NULL DEFAULT 1 CHECK ("weightBps" >= 1 AND "weightBps" <= 10000),
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL,

    PRIMARY KEY ("allocationId", "categoryCode"),
    CONSTRAINT "participant_allocation_items_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "participant_allocations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "participant_allocations_participantId_idx" ON "participant_allocations" ("participantId");

-- CreateIndex
CREATE INDEX "participant_allocations_fiscalYear_idx" ON "participant_allocations" ("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "participant_allocations_participantId_fiscalYear_key" ON "participant_allocations" ("participantId", "fiscalYear");

-- CreateIndex
CREATE INDEX "participant_allocation_items_categoryCode_idx" ON "participant_allocation_items" ("categoryCode");
