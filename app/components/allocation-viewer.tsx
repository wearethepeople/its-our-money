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
import { bpsToSliderWeight } from "@/utils/normalize-weights.ts";
import { MAX_ALLOCATION_WEIGHT } from "@/constants/index.ts";
import { AllocationRoundingNote } from "@/components/allocation-rounding-note.tsx";

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

  const maxPercent = Math.max(
    ...sortedPairedData.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  const weightedPairedData = useMemo(
    () =>
      sortedPairedData.map((d) => ({
        ...d,
        participantPercent: bpsToSliderWeight(d.participantPercent * 100, MAX_ALLOCATION_WEIGHT),
        budgetPercent: bpsToSliderWeight(d.budgetPercent * 100, MAX_ALLOCATION_WEIGHT),
      })),
    [sortedPairedData],
  );

  const weightsMaxPercent = Math.max(
    ...weightedPairedData.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  return (
    <div>
      <div
        className="my-4 flex flex-nowrap items-center gap-3 bg-background sticky top-(--header-height) py-2"
        id="data-massage"
        ref={(el) => {
          if (el)
            document.documentElement.style.setProperty(
              "--data-massage-height",
              `${el.offsetHeight}px`,
            );
        }}
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
      <div
        className="flex border-b border-muted-foreground bg-background sticky top-[calc(var(--header-height)+var(--data-massage-height))]"
        ref={(el) => {
          if (el)
            document.documentElement.style.setProperty("--tabs-height", `${el.offsetHeight}px`);
        }}
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
      {activeTab === "priorities" && (
        <div>
          <AllocationRoundingNote />
          <ComparisonLegend
            ombYear={ombYear}
            className="sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))]"
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
          <ComparisonLegend
            ombYear={ombYear}
            className="sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))]"
          />
          <ComparisonList
            items={sortedPairedData}
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
