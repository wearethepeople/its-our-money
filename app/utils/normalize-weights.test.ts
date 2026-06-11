import { describe, expect, test } from "vitest";
import { bpsToSliderWeight } from "./normalize-weights.ts";

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

  test("clamps to a minimum weight of 1", () => {
    expect(bpsToSliderWeight(0, 20)).toBe(1);
    expect(bpsToSliderWeight(100, 20)).toBe(1);
  });

  test("clamps to the max weight", () => {
    expect(bpsToSliderWeight(20000, 20)).toBe(20);
  });
});
