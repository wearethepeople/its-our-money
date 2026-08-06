import { describe, expect, test } from "vitest";
import type { PairedItem } from "@/components/comparison.tsx";
import { computeInsights, insightApplies } from "./insights.ts";

function item(id: string, participantPercent: number, budgetPercent: number): PairedItem {
  return {
    id,
    code: `code_${id}`,
    category: `Category ${id}`,
    participantPercent,
    budgetPercent,
    delta: participantPercent - budgetPercent,
  };
}

const pairedData: PairedItem[] = [
  item("1", 40, 10), // delta +30
  item("2", 5, 30), // delta -25
  item("3", 20, 25), // delta -5
  item("4", 30, 28), // delta +2
  item("5", 4, 4.5), // delta -0.5
  item("6", 1, 2.5), // delta -1.5
];

describe("computeInsights", () => {
  const insights = computeInsights(pairedData);

  test("top3 holds the three largest absolute deltas in order", () => {
    expect(insights.top3.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  test("identifies Washington's top function and your rank of it", () => {
    expect(insights.washingtonTop?.id).toBe("2");
    expect(insights.yourRank).toBe(4);
  });

  test("nearlyZeroedOut is your smallest allocation", () => {
    expect(insights.nearlyZeroedOut?.id).toBe("6");
  });

  test("agreements only consider functions Washington spends at least 5% on", () => {
    const ids = insights.surpriseAgreements.map((i) => i.id);
    expect(ids).toEqual(["4", "3", "2"]);
    expect(ids).not.toContain("5");
  });

  test("closestCall ignores functions where both sides are at 1% or below", () => {
    expect(insights.closestCall?.id).toBe("5");
  });

  test("computes top-3 shares for both sides", () => {
    expect(insights.yourTop3.map((i) => i.id)).toEqual(["1", "4", "3"]);
    expect(insights.yourTop3Share).toBe(90);
    expect(insights.washTop3Share).toBe(83);
  });
});

describe("insightApplies", () => {
  test("rank-flip applies only when you and Washington disagree on #1", () => {
    expect(insightApplies("rank-flip", computeInsights(pairedData))).toBe(true);

    const agreeing = [item("1", 50, 50), item("2", 50, 50)];
    expect(insightApplies("rank-flip", computeInsights(agreeing))).toBe(false);
  });

  test("other insights always apply", () => {
    expect(insightApplies("biggest-departures", computeInsights(pairedData))).toBe(true);
    expect(insightApplies("concentrated-bet", computeInsights(pairedData))).toBe(true);
  });
});
