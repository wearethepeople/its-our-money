import { describe, expect, test } from "vitest";
import {
  bpsToSliderWeight,
  normalizeToBasisPoints,
  percentToDisplayWeight,
  sum,
  toStoredAllocations,
} from "./normalize-weights.ts";

describe("bpsToSliderWeight", () => {
  test("converts full allocation to max weight", () => {
    expect(bpsToSliderWeight(10000, 20)).toBe(20);
  });

  test("rounds to the nearest weight", () => {
    // 1250 bps * 20 / 10000 = 2.5 → rounds to 3
    expect(bpsToSliderWeight(1250, 20)).toBe(3);
    // 1200 bps * 20 / 10000 = 2.4 → rounds to 2
    expect(bpsToSliderWeight(1200, 20)).toBe(2);
  });

  // Backward-compat guarantee: a *stored* item is always >= 1 bps, and it must
  // never round down to a visually-blank 0 on the slider.
  test("clamps to a minimum weight of 1", () => {
    expect(bpsToSliderWeight(0, 20)).toBe(1);
    expect(bpsToSliderWeight(100, 20)).toBe(1);
  });

  test("clamps to the max weight", () => {
    expect(bpsToSliderWeight(20000, 20)).toBe(20);
  });
});

describe("percentToDisplayWeight", () => {
  test("a genuine 0% maps to 0 (no bar)", () => {
    expect(percentToDisplayWeight(0, 20)).toBe(0);
  });

  test("a tiny nonzero percent is floored to 1 (lowest spot on the scale)", () => {
    expect(percentToDisplayWeight(1.1, 20)).toBe(1);
  });

  test("larger percentages scale onto the 1..max range", () => {
    expect(percentToDisplayWeight(50, 20)).toBe(10);
    expect(percentToDisplayWeight(100, 20)).toBe(20);
  });
});

describe("normalizeToBasisPoints", () => {
  test("preserves zeros and distributes the rest to sum to 10,000", () => {
    expect(normalizeToBasisPoints([0, 10, 10])).toEqual([0, 5000, 5000]);
  });

  test("keeps zeros at 0 in a mixed input while summing to 10,000", () => {
    const result = normalizeToBasisPoints([0, 3, 0, 5, 2]);
    expect(result[0]).toBe(0);
    expect(result[2]).toBe(0);
    expect(sum(result)).toBe(10000);
  });

  test("all-zero input stays all zero (the form guard blocks this case upstream)", () => {
    expect(normalizeToBasisPoints([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe("toStoredAllocations", () => {
  test("drops zero-weight categories and sums the rest to 10,000", () => {
    const result = toStoredAllocations([
      { id: "a", weight: 0 },
      { id: "b", weight: 10 },
      { id: "c", weight: 0 },
      { id: "d", weight: 10 },
    ]);

    expect(result.map((item) => item.id)).toEqual(["b", "d"]);
    expect(sum(result.map((item) => item.bps))).toBe(10000);
  });

  test("returns an empty array when every weight is 0", () => {
    expect(
      toStoredAllocations([
        { id: "a", weight: 0 },
        { id: "b", weight: 0 },
      ]),
    ).toEqual([]);
  });
});
