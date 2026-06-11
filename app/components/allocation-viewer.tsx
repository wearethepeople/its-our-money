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
  const [activeTab, setActiveTab] = useState<"comparison" | "tax-breakdown">("comparison");

  const sortedPairedData = useMemo(
    () => sortPairedData(pairedData, sortMode, sortDirection),
    [pairedData, sortDirection, sortMode],
  );

  const maxPercent = Math.max(
    ...sortedPairedData.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
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
        className="flex border-b border-ink bg-background sticky top-[calc(var(--header-height)+var(--data-massage-height))]"
        ref={(el) => {
          if (el)
            document.documentElement.style.setProperty("--tabs-height", `${el.offsetHeight}px`);
        }}
        id="tabs"
      >
        <button
          type="button"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "comparison"
              ? "border-you"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setActiveTab("comparison")}
        >
          Comparison
        </button>
        <button
          type="button"
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === "tax-breakdown"
              ? "border-you"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
          onClick={() => setActiveTab("tax-breakdown")}
        >
          Tax Breakdown
        </button>
      </div>
      {activeTab === "comparison" && (
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
