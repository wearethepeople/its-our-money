import type { PairedItem } from "@/components/comparison.tsx";

export type InsightId =
  | "biggest-departures"
  | "rank-flip"
  | "nearly-zeroed-out"
  | "agreements"
  | "closest-call"
  | "concentrated-bet";

export type ComputedInsights = ReturnType<typeof computeInsights>;

/** Whether an insight has anything to say for this data (e.g. "rank-flip" is moot when you and Washington share a #1). */
export function insightApplies(id: InsightId, insights: ComputedInsights) {
  if (id === "rank-flip") return insights.washingtonTop !== null && insights.yourRank !== 1;
  return true;
}

/** Derive the headline insights shown on insight cards from paired allocation data. */
export function computeInsights(pairedData: PairedItem[]) {
  const byAbsDelta = [...pairedData].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const top3 = byAbsDelta.slice(0, 3);

  const byWashington = [...pairedData].sort((a, b) => b.budgetPercent - a.budgetPercent);
  const byYou = [...pairedData].sort((a, b) => b.participantPercent - a.participantPercent);
  const washingtonTop = byWashington[0] ?? null;
  const yourRank = washingtonTop ? byYou.findIndex((i) => i.id === washingtonTop.id) + 1 : 0;

  const nearlyZeroedOut =
    [...pairedData].sort((a, b) => a.participantPercent - b.participantPercent)[0] ?? null;

  const surpriseAgreements = [...pairedData]
    .filter((i) => i.budgetPercent >= 5)
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    .slice(0, 3);

  const closestCall =
    [...pairedData]
      .filter((i) => i.participantPercent > 1 || i.budgetPercent > 1)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0] ?? null;

  const yourTop3 = [...pairedData]
    .sort((a, b) => b.participantPercent - a.participantPercent)
    .slice(0, 3);
  const yourTop3Share = yourTop3.reduce((s, i) => s + i.participantPercent, 0);
  const washTop3Share = [...pairedData]
    .sort((a, b) => b.budgetPercent - a.budgetPercent)
    .slice(0, 3)
    .reduce((s, i) => s + i.budgetPercent, 0);

  return {
    top3,
    washingtonTop,
    yourRank,
    nearlyZeroedOut,
    surpriseAgreements,
    closestCall,
    yourTop3,
    yourTop3Share,
    washTop3Share,
  };
}
