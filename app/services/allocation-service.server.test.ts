import { describe, expect, test } from "vitest";

import { FUNCTIONS } from "@/constants/budget-functions.ts";
import { sum } from "@/utils/normalize-weights.ts";

import { AllocationService } from "./allocation-service.server.ts";

const allocatableFunctions = FUNCTIONS.filter((f) => f.allocatable !== false);

type AllocationArg = Awaited<ReturnType<typeof AllocationService.getAllocationByParticipantId>>;

/**
 * Fabricate the minimal allocation shape `zipAllocationWithUsFiscalBudget` reads
 * (`.items` only). No DB is involved.
 */
function makeAllocation(items: { categoryCode: string; weightBps: number }[]): AllocationArg {
  return { items } as unknown as AllocationArg;
}

describe("zipAllocationWithUsFiscalBudget", () => {
  test("legacy full allocation (all 18 items) renders each stored value unchanged", async () => {
    // Distribute 10,000 bps across every allocatable function (sums to exactly 10,000).
    const base = Math.floor(10000 / allocatableFunctions.length);
    const remainder = 10000 - base * allocatableFunctions.length;
    const items = allocatableFunctions.map((f, i) => ({
      categoryCode: f.id,
      weightBps: base + (i === 0 ? remainder : 0),
    }));
    const weightByCode = new Map(items.map((item) => [item.categoryCode, item.weightBps]));

    const rows = await AllocationService.zipAllocationWithUsFiscalBudget(makeAllocation(items));

    expect(rows).toHaveLength(allocatableFunctions.length);
    for (const row of rows) {
      expect(row.participantPercent).toBeCloseTo((weightByCode.get(row.id) ?? 0) / 100, 6);
    }
    expect(sum(rows.map((r) => r.participantPercent))).toBeCloseTo(100, 6);
  });

  test("sparse allocation: omitted categories read as 0% (new zero semantics)", async () => {
    // Only three categories carry weight; the rest are not stored.
    const stored = [
      { categoryCode: allocatableFunctions[0]!.id, weightBps: 5000 },
      { categoryCode: allocatableFunctions[1]!.id, weightBps: 3000 },
      { categoryCode: allocatableFunctions[2]!.id, weightBps: 2000 },
    ];
    const weightByCode = new Map(stored.map((item) => [item.categoryCode, item.weightBps]));

    const rows = await AllocationService.zipAllocationWithUsFiscalBudget(makeAllocation(stored));

    // Still returns a row for every allocatable function.
    expect(rows).toHaveLength(allocatableFunctions.length);
    for (const row of rows) {
      const storedWeight = weightByCode.get(row.id);
      if (storedWeight === undefined) {
        expect(row.participantPercent).toBe(0);
      } else {
        expect(row.participantPercent).toBeCloseTo(storedWeight / 100, 6);
      }
    }
    // The three stored categories still total 100%.
    expect(sum(rows.map((r) => r.participantPercent))).toBeCloseTo(100, 6);
  });

  test("single category at 10,000 bps is 100%, all others 0%", async () => {
    const soleId = allocatableFunctions[0]!.id;
    const rows = await AllocationService.zipAllocationWithUsFiscalBudget(
      makeAllocation([{ categoryCode: soleId, weightBps: 10000 }]),
    );

    for (const row of rows) {
      expect(row.participantPercent).toBe(row.id === soleId ? 100 : 0);
    }
  });
});
