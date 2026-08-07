import { useMemo, useState } from "react";
import { ViewToggle } from "@/components/view-toggle.tsx";
import { type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import {
  ComparisonLegend,
  ComparisonList,
  SortControls,
  sortPairedData,
  type PairedItem,
  type SortDirection,
  type SortMode,
} from "@/components/comparison.tsx";
import { TaxBreakdown } from "@/components/tax-breakdown.tsx";
import { bpsToSliderWeight, percentToDisplayWeight } from "@/utils/normalize-weights.ts";
import { MAX_ALLOCATION_WEIGHT } from "@/constants/index.ts";
import {
  WeightsRoundingNote,
  PercentsRoundingNote,
} from "@/components/allocation-rounding-note.tsx";
import { useElementHeightVar } from "@/hooks/use-element-height-var.ts";

export type { PairedItem } from "@/components/comparison.tsx";

export function AllocationViewer({
  pairedData,
  netInterestBps,
  ombYear,
  subject = "you",
}: {
  pairedData: PairedItem[];
  netInterestBps: number;
  ombYear: number;
  subject?: "you" | "they";
}) {
  const [viewScheme, setViewScheme] = useState<ViewSchemeId>("public_domain");
  const [sortMode, setSortMode] = useState<SortMode>("participantPercent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTab, setActiveTab] = useState<"priorities" | "percentages" | "tax-breakdown">(
    "priorities",
  );

  const sortedPairedData = useMemo(
    () => sortPairedData(pairedData, sortMode, sortDirection),
    [pairedData, sortDirection, sortMode],
  );

  const pairedDataWithNetInterest = useMemo(() => {
    if (netInterestBps <= 0) return pairedData;
    const netInterestPercent = netInterestBps / 100;
    return [
      ...pairedData,
      {
        code: "900",
        category: "Net Interest",
        id: "net_interest",
        participantPercent: netInterestPercent,
        budgetPercent: netInterestPercent,
        delta: 0,
      },
    ];
  }, [pairedData, netInterestBps]);

  const sortedPairedDataWithNetInterest = useMemo(
    () => sortPairedData(pairedDataWithNetInterest, sortMode, sortDirection),
    [pairedDataWithNetInterest, sortDirection, sortMode],
  );

  const maxPercent = Math.max(
    ...sortedPairedDataWithNetInterest.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  const weightedPairedData = useMemo(
    () =>
      sortedPairedDataWithNetInterest.map((d) => ({
        ...d,
        // A genuine 0% (an untouched category) stays 0 so no "You" bar renders;
        // Washington keeps its round-up to the lowest spot (see WeightsRoundingNote).
        participantPercent: percentToDisplayWeight(d.participantPercent, MAX_ALLOCATION_WEIGHT),
        budgetPercent: bpsToSliderWeight(d.budgetPercent * 100, MAX_ALLOCATION_WEIGHT),
      })),
    [sortedPairedDataWithNetInterest],
  );

  const weightsMaxPercent = Math.max(
    ...weightedPairedData.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  // Any allocatable category the participant left unweighted (net interest is
  // always > 0 and not a user choice, so it never counts as skipped).
  const hasSkipped = pairedData.some((d) => d.participantPercent === 0);

  const dataMassageRef = useElementHeightVar<HTMLDivElement>("--data-massage-height");
  const tabsRef = useElementHeightVar<HTMLDivElement>("--tabs-height");

  return (
    <div>
      <div
        className="flex border-b border-muted-foreground bg-background sticky top-(--header-height) z-50"
        ref={tabsRef}
        id="tabs"
      >
        <button
          type="button"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "priorities"
              ? "border-you bg-you/10"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setActiveTab("priorities")}
        >
          Priorities
        </button>
        <button
          type="button"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "percentages"
              ? "border-you bg-you/10"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setActiveTab("percentages")}
        >
          Percentages
        </button>
        <button
          type="button"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "tax-breakdown"
              ? "border-you bg-you/10"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setActiveTab("tax-breakdown")}
        >
          Tax Breakdown
        </button>
      </div>
      <div
        className="flex flex-nowrap items-center gap-3 bg-background sticky top-[calc(var(--header-height)+var(--tabs-height))] z-40 pt-6"
        id="data-massage"
        ref={dataMassageRef}
      >
        <SortControls
          sortMode={sortMode}
          sortDirection={sortDirection}
          onChange={(mode, direction) => {
            setSortMode(mode);
            setSortDirection(direction);
          }}
        />
        <div className="ml-auto">
          <ViewToggle value={viewScheme} onChange={setViewScheme} />
        </div>
      </div>
      {activeTab === "priorities" && (
        <div>
          <WeightsRoundingNote />
          <ComparisonLegend
            ombYear={ombYear}
            hasSkipped={hasSkipped}
            className="sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))] z-0"
          />
          <ComparisonList
            items={weightedPairedData}
            maxPercent={weightsMaxPercent}
            viewScheme={viewScheme}
            badges="none"
          />
        </div>
      )}
      {activeTab === "percentages" && (
        <div>
          <PercentsRoundingNote />
          <ComparisonLegend
            ombYear={ombYear}
            hasSkipped={hasSkipped}
            className="sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))]"
          />
          <ComparisonList
            items={sortedPairedDataWithNetInterest}
            maxPercent={maxPercent}
            viewScheme={viewScheme}
          />
        </div>
      )}
      {activeTab === "tax-breakdown" && (
        <TaxBreakdown
          pairedData={sortedPairedData}
          netInterestBps={netInterestBps}
          viewScheme={viewScheme}
          subject={subject}
          stickyHeaderClassName="sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))]"
        />
      )}
    </div>
  );
}
