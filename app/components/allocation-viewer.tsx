import { Fragment, useMemo, useState } from "react";
import { cn } from "@/utils/misc.tsx";
import { ViewToggle } from "@/components/view-toggle.tsx";
import { PUBLIC_DOMAIN_SCHEME, type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { Button } from "@/ui/button.tsx";
import { ButtonGroup } from "@/ui/button-group.tsx";
import { Badge } from "@/ui/badge.tsx";
import { Card } from "#app/components/ui/card.tsx";
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
} from "@/utils/numbers.ts";

export type PairedItem = {
  code: string;
  category: string;
  id: string;
  participantPercent: number;
  budgetPercent: number;
  delta: number;
};

type SortModes = "participantPercent" | "budgetPercent" | "delta" | "category";

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
  const possessive = subject === "you" ? "your" : "their";
  const [viewScheme, setViewScheme] = useState<ViewSchemeId>("public_domain");
  const [sortMode, setSortMode] = useState<SortModes>("participantPercent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [taxAmount, setTaxAmount] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"comparison" | "tax-breakdown">("comparison");

  const netInterestFraction = netInterestBps / 10000;
  const allocatableFraction = 1 - netInterestFraction;

  const sortedPairedData = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...pairedData].sort((a, b) => {
      if (sortMode === "category") {
        return a.category.localeCompare(b.category) * direction;
      }
      return (a[sortMode] - b[sortMode]) * direction;
    });
  }, [pairedData, sortDirection, sortMode]);

  const maxPercent = Math.max(
    ...sortedPairedData.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  function handleSortModeClick(mode: SortModes) {
    if (mode === sortMode) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortMode(mode);
    setSortDirection("desc");
  }

  return (
    <div>
      <div
        className="my-4 flex flex-wrap items-center gap-3 bg-background sticky top-(--header-height) py-2"
        id="data-massage"
        ref={(el) => {
          if (el)
            document.documentElement.style.setProperty(
              "--data-massage-height",
              `${el.offsetHeight}px`,
            );
        }}
      >
        <ButtonGroup>
          {(
            [
              { mode: "participantPercent", label: "Yours" },
              { mode: "budgetPercent", label: "Federal" },
              { mode: "delta", label: "Difference" },
              { mode: "category", label: "Function" },
            ] as const
          ).map(({ mode, label }) => (
            <Button
              key={mode}
              size="sm"
              variant={sortMode === mode ? "default" : "outline"}
              onClick={() => handleSortModeClick(mode)}
            >
              {label}
              {sortMode === mode ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
            </Button>
          ))}
        </ButtonGroup>
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
          <ComparisonLegend ombYear={ombYear} possessive={possessive} />
          {viewScheme === "flat" ? (
            <div className="divide-y">
              {sortedPairedData.map((item) => (
                <ComparisonRow key={item.code} item={item} maxPercent={maxPercent} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {PUBLIC_DOMAIN_SCHEME.groups.map((group) => {
                const groupItems = sortedPairedData.filter((d) =>
                  group.functionIds.includes(String(d.id)),
                );
                if (!groupItems.length) return null;
                return (
                  <div key={group.id}>
                    <h3 className="mb-2 border-b border-ink-muted pb-1 text-sm font-semibold tracking-wide uppercase">
                      {group.label}
                    </h3>
                    <div className="divide-y divide-line">
                      {groupItems.map((item, index) => (
                        <div key={item.code} className={index % 2 === 1 ? "bg-surface-2" : ""}>
                          <ComparisonRow item={item} maxPercent={maxPercent} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {activeTab === "tax-breakdown" && (
        <div className="mt-6">
          <Card className="py-3 px-4">
            <p>
              Enter your total federal tax payment to see how the government spent it versus how{" "}
              {subject} would have.
            </p>
            <p className="text-ink-faint">
              The figure you enter here is used only for this in-page calculation and is never
              stored or transmitted. No personal financial information is collected or retained —
              the math happens entirely in your browser.
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="tax-amount" className="text-sm font-medium text-ink-muted">
                Federal taxes paid:
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm text-ink-muted">$</span>
                <input
                  id="tax-amount"
                  type="number"
                  min="0"
                  className="w-36 rounded border border-line-2 py-1.5 pr-3 pl-7 text-sm font-mono"
                  value={taxAmount}
                  onChange={(e) =>
                    setTaxAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
          {taxAmount !== "" && taxAmount > 0 && (
            <table className="mt-4 w-full text-sm">
              <thead className="bg-background sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))]">
                <tr className="border-b border-ink">
                  <th className="pb-2 text-left tax-breakdown-header">Budget Function</th>
                  <th className="pb-2 text-right tax-breakdown-header">
                    {subject === "you" ? "You" : "Theirs"}
                  </th>
                  <th className="pb-2 text-right tax-breakdown-header">Actual</th>
                  <th className="pb-2 text-right tax-breakdown-header">Difference</th>
                </tr>
              </thead>
              <tbody>
                {viewScheme === "flat" ? (
                  <>
                    {sortedPairedData.map((item) => {
                      const yourDollars = Math.round(
                        (item.participantPercent / 100) * allocatableFraction * taxAmount,
                      );
                      const actualDollars = Math.round(
                        (item.budgetPercent / 100) * allocatableFraction * taxAmount,
                      );
                      const difference = yourDollars - actualDollars;
                      return (
                        <tr key={item.code} className="border-b border-b-line">
                          <td className="py-1.5">{item.category}</td>
                          <td className="py-1.5 text-right numeric text-you">
                            {formatCurrency(yourDollars)}
                          </td>
                          <td className="py-1.5 text-right numeric text-them">
                            {formatCurrency(actualDollars)}
                          </td>
                          <td className="py-1.5 text-right numeric">
                            <DeltaCurrencyBadge value={difference} />
                          </td>
                        </tr>
                      );
                    })}
                    {netInterestBps > 0 && (
                      <tr className="border-b border-b-line text-locked">
                        <td className="py-1.5">Net Interest (mandatory)</td>
                        <td className="py-1.5 text-right numeric text-you">
                          {formatCurrency(netInterestFraction * taxAmount)}
                        </td>
                        <td className="py-1.5 text-right numeric text-them">
                          {formatCurrency(netInterestFraction * taxAmount)}
                        </td>
                        <td className="py-1.5 text-right numeric">
                          <DeltaCurrencyBadge value={0} />
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    {PUBLIC_DOMAIN_SCHEME.groups.map((group) => {
                      const groupItems = sortedPairedData.filter((item) =>
                        group.functionIds.includes(String(item.id)),
                      );
                      if (!groupItems.length) return null;
                      const groupYours = groupItems.reduce(
                        (sum, item) =>
                          sum +
                          Math.round(
                            (item.participantPercent / 100) * allocatableFraction * taxAmount,
                          ),
                        0,
                      );
                      const groupActual = groupItems.reduce(
                        (sum, item) =>
                          sum +
                          Math.round(
                            (item.budgetPercent / 100) * allocatableFraction * taxAmount,
                          ),
                        0,
                      );
                      const groupDiff = groupYours - groupActual;
                      return (
                        <Fragment key={group.id}>
                          <tr>
                            <td
                              colSpan={4}
                              className="border-b border-ink-muted pt-4 pb-1 text-xs font-semibold tracking-wide uppercase"
                            >
                              {group.label}
                            </td>
                          </tr>
                          {groupItems.map((item) => {
                            const yourDollars = Math.round(
                              (item.participantPercent / 100) * allocatableFraction * taxAmount,
                            );
                            const actualDollars = Math.round(
                              (item.budgetPercent / 100) * allocatableFraction * taxAmount,
                            );
                            const difference = yourDollars - actualDollars;
                            return (
                              <tr key={item.code} className="border-b border-line">
                                <td className="py-1.5 pl-3">{item.category}</td>
                                <td className="py-1.5 text-right numeric text-you">
                                  {formatCurrency(yourDollars)}
                                </td>
                                <td className="py-1.5 text-right numeric text-them">
                                  {formatCurrency(actualDollars)}
                                </td>
                                <td className="py-1.5 text-right numeric">
                                  <DeltaCurrencyBadge value={difference} />
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="border-b border-line">
                            <td className="py-1.5 pl-3 text-xs font-semibold">Subtotal</td>
                            <td className="py-1.5 text-right font-semibold numeric text-you">
                              {formatCurrency(groupYours)}
                            </td>
                            <td className="py-1.5 text-right font-semibold numeric text-them">
                              {formatCurrency(groupActual)}
                            </td>
                            <td className="py-1.5 text-right font-semibold numeric">
                              <DeltaCurrencyBadge value={groupDiff} />
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                    {netInterestBps > 0 && (
                      <tr className="border-b border-line text-locked">
                        <td className="py-1.5">Net Interest (mandatory)</td>
                        <td className="py-1.5 text-right text-you">
                          {formatCurrency(netInterestFraction * taxAmount)}
                        </td>
                        <td className="py-1.5 text-right text-them">
                          {formatCurrency(netInterestFraction * taxAmount)}
                        </td>
                        <td className="py-1.5 text-right">
                          <DeltaCurrencyBadge value={0} />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right numeric text-you">{formatCurrency(taxAmount)}</td>
                  <td className="pt-2 text-right numeric text-them">{formatCurrency(taxAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function PercentBadge({ value, className }: { value: number; className?: string }) {
  return (
    <Badge variant="ghost" className={cn("font-mono tabular-nums", className)}>
      {formatPercent(value)}
    </Badge>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const nearZero = Math.abs(value) < 0.2;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono tabular-nums border-transparent",
        nearZero
          ? "bg-surface-3 text-ink-faint"
          : value > 0
            ? "bg-you-soft text-you"
            : "bg-them-soft text-them",
      )}
    >
      {formatSignedPercent(value)}
    </Badge>
  );
}

function DeltaCurrencyBadge({ value }: { value: number }) {
  const nearZero = Math.abs(value) < 1;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono tabular-nums border-transparent",
        nearZero
          ? "bg-surface-3 text-ink-faint"
          : value > 0
            ? "bg-you-soft text-you"
            : "bg-them-soft text-them",
      )}
    >
      {formatSignedCurrency(value)}
    </Badge>
  );
}

function ComparisonLegend({ ombYear, possessive }: { ombYear: number; possessive: string }) {
  const fy = String(ombYear).slice(2);
  return (
    <div className="bg-background mb-6 mt-4 flex items-center py-2 gap-5 text-sm sticky top-[calc(var(--header-height)+var(--data-massage-height)+var(--tabs-height))]">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-you" />
        <span className="text-ink-muted">{possessive.charAt(0).toUpperCase() + possessive.slice(1)} priorities</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-them" />
        <span className="text-ink-muted">Washington (FY{fy})</span>
      </div>
    </div>
  );
}

function ComparisonRow({ item, maxPercent }: { item: PairedItem; maxPercent: number }) {
  const scale = maxPercent > 0 ? 100 / maxPercent : 1;
  return (
    <article className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{item.category}</span>
        <div className="flex shrink-0 items-center gap-1">
          <PercentBadge value={item.participantPercent} className="text-you" />
          <span className="text-xs text-muted-foreground">vs</span>
          <PercentBadge value={item.budgetPercent} className="text-them" />
          <DeltaBadge value={item.delta} />
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        <div
          className="h-2 rounded-full bg-you"
          style={{ width: `${item.participantPercent * scale}%` }}
        />
        <div
          className="h-2 rounded-full bg-them"
          style={{ width: `${item.budgetPercent * scale}%` }}
        />
      </div>
    </article>
  );
}
