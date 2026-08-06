import { cn } from "@/utils/misc.tsx";
import { Badge } from "@/ui/badge.tsx";
import { Button } from "@/ui/button.tsx";
import { ButtonGroup } from "@/ui/button-group.tsx";
import { Card, CardContent, CardTitle } from "@/ui/card.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible.tsx";
import { Icon } from "@/ui/icon.tsx";
import { PUBLIC_DOMAIN_SCHEME, type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { getFunctionDetailsById } from "@/utils/budget-data.ts";
import { formatPercent, formatSignedCurrency, formatSignedPercent } from "@/utils/numbers.ts";
import { WithClassName } from "@/types/ui";
import { Info } from "lucide-react";

export type PairedItem = {
  code: string;
  category: string;
  id: string;
  participantPercent: number;
  budgetPercent: number;
  delta: number;
};

export type SortMode = "participantPercent" | "budgetPercent" | "delta" | "category";
export type SortDirection = "asc" | "desc";

export function sortPairedData(
  pairedData: PairedItem[],
  sortMode: SortMode,
  sortDirection: SortDirection,
) {
  const direction = sortDirection === "asc" ? 1 : -1;
  return [...pairedData].sort((a, b) => {
    if (sortMode === "category") {
      return a.category.localeCompare(b.category) * direction;
    }
    return (a[sortMode] - b[sortMode]) * direction;
  });
}

export function SortControls({
  sortMode,
  sortDirection,
  onChange,
}: {
  sortMode: SortMode;
  sortDirection: SortDirection;
  onChange: (sortMode: SortMode, sortDirection: SortDirection) => void;
}) {
  function handleClick(mode: SortMode) {
    if (mode === sortMode) {
      onChange(mode, sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    onChange(mode, "desc");
  }

  return (
    <ButtonGroup className="overflow-x-auto min-w-0" id="sorts">
      {(
        [
          { mode: "participantPercent", label: "Yours" },
          { mode: "budgetPercent", label: "Washington" },
          { mode: "delta", label: "Difference" },
          { mode: "category", label: "Function" },
        ] as const
      ).map(({ mode, label }) => (
        <Button
          key={mode}
          size="sm"
          variant={sortMode === mode ? "default" : "outline"}
          onClick={() => handleClick(mode)}
        >
          {label}
          {sortMode === mode ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
        </Button>
      ))}
    </ButtonGroup>
  );
}

export function ComparisonList({
  items,
  maxPercent,
  viewScheme,
  badges,
}: {
  /** Items in the order rows should render. */
  items: PairedItem[];
  maxPercent: number;
  viewScheme: ViewSchemeId;
  badges?: "percent" | "none";
}) {
  if (viewScheme === "flat") {
    return (
      <div className="divide-y divide-muted-foreground">
        {items.map((item) => (
          <ComparisonRow key={item.code} item={item} maxPercent={maxPercent} badges={badges} />
        ))}
      </div>
    );
  }

  const groupedFunctionIds = new Set(
    PUBLIC_DOMAIN_SCHEME.groups.flatMap((group) => group.functionIds),
  );
  const ungroupedItems = items.filter((d) => !groupedFunctionIds.has(String(d.id)));

  return (
    <div className="flex flex-col gap-10">
      {PUBLIC_DOMAIN_SCHEME.groups.map((group) => {
        const groupItems = items.filter((d) => group.functionIds.includes(String(d.id)));
        if (!groupItems.length) return null;
        return (
          <div key={group.id} className="public-domain rounded bg-surface p-3">
            <h3 className="mb-2 border-b border-ink-muted pb-1 text-sm font-semibold tracking-wide uppercase">
              {group.label}
            </h3>
            <div className="divide-y divide-muted-foreground">
              {groupItems.map((item, index, arr) => (
                <div
                  key={item.code}
                  className={cn(
                    index % 2 === 1 ? "bg-surface-2" : "",
                    index + 1 === arr.length ? "rounded-b" : "",
                  )}
                >
                  <ComparisonRow item={item} maxPercent={maxPercent} badges={badges} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {ungroupedItems.length > 0 && (
        <div className="public-domain rounded bg-surface p-3">
          <div className="divide-y divide-muted-foreground">
            {ungroupedItems.map((item, index) => (
              <div key={item.code} className={index % 2 === 1 ? "bg-surface-2" : ""}>
                <ComparisonRow item={item} maxPercent={maxPercent} badges={badges} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PercentBadge({ value, className }: { value: number; className?: string }) {
  return (
    <Badge variant="ghost" className={cn("font-mono tabular-nums", className)}>
      {formatPercent(value)}
    </Badge>
  );
}

export function DeltaBadge({ value, className }: { value: number; className?: string }) {
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
        className,
      )}
    >
      {formatSignedPercent(value)}
    </Badge>
  );
}

export function DeltaCurrencyBadge({ value }: { value: number }) {
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

/**
 * The hollow-ring mark for a category the participant left unweighted. Shared by
 * the comparison bars and the legend so the two can't visually drift. Pass
 * `aria-label` where the ring is the only indicator (a bar row); omit it where a
 * text label already names it (the legend).
 */
export function SkippedMarker({
  className,
  "aria-label": ariaLabel,
}: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <span
      {...(ariaLabel ? { role: "img", "aria-label": ariaLabel } : { "aria-hidden": true })}
      className={cn("inline-block rounded-full border-[1.5px] border-you", className)}
    />
  );
}

export function ComparisonLegend({
  ombYear,
  hasSkipped = false,
  className,
}: {
  ombYear: number;
  hasSkipped?: boolean;
  className?: string;
}) {
  const fy = String(ombYear).slice(2);
  return (
    <div
      className={cn(
        "bg-background mt-4 flex flex-col gap-2 sm:flex-row sm:gap-0 mb-6 py-2",
        className,
      )}
    >
      <div className="flex flex-wrap gap-5 text-sm sm:grow">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-you" />
          <span className="text-ink-muted">You</span>
        </div>
        {hasSkipped && (
          <div className="flex items-center gap-1.5">
            <SkippedMarker className="size-3" />
            <span className="text-ink-muted">You (skipped)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-them" />
          <span className="text-ink-muted">Washington (FY{fy})</span>
        </div>
      </div>
      <div className="flex text-ink-faint text-xs gap-1 items-center">
        Tap a{" "}
        <span className="text-ink-2 underline decoration-dotted decoration-you underline-offset-2">
          Budget Function
        </span>{" "}
        for context.
      </div>
    </div>
  );
}

export function ComparisonRow({
  item,
  maxPercent,
  badges = "percent",
}: WithClassName<{
  item: PairedItem;
  maxPercent: number;
  badges?: "percent" | "none";
}>) {
  const scale = maxPercent > 0 ? 100 / maxPercent : 1;
  const fnData = getFunctionDetailsById(item.id);
  const isNetInterest = item.id === "net_interest";

  return (
    <article className="py-3 px-4">
      <Collapsible className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-left text-sm font-medium text-ink-2 data-panel-open:text-you underline decoration-dotted decoration-you underline-offset-2 hover:cursor-pointer">
              {isNetInterest && (
                <Icon name="lock-closed" className="size-3.5 shrink-0 text-ink-faint" />
              )}
              {item.category}
            </CollapsibleTrigger>
          </h3>
          {badges === "percent" && (
            <div className="flex shrink-0 items-center gap-1">
              <PercentBadge value={item.participantPercent} className="text-you" />
              <span className="text-xs text-muted-foreground">vs</span>
              <PercentBadge value={item.budgetPercent} className="text-them" />
              <DeltaBadge value={item.delta} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {item.participantPercent > 0 ? (
            <div
              className="h-2 rounded-full bg-you"
              style={{ width: `${item.participantPercent * scale}%` }}
            />
          ) : (
            // Untouched category: a hollow ring reads as "you weighted this at
            // zero" without borrowing the filled-bar vocabulary.
            <div className="flex h-2 items-center">
              <SkippedMarker className="size-2.5" aria-label="You left this unweighted" />
            </div>
          )}
          <div
            className="h-2 rounded-full bg-them"
            style={{ width: `${item.budgetPercent * scale}%` }}
          />
        </div>
        {fnData && (
          <CollapsibleContent>
            <Card className="bg-surface-3 border-line-2 border-l-2 border-l-you/60 my-6">
              <CardTitle className="px-4 uppercase text-ink-muted">What this pays for</CardTitle>
              {isNetInterest && (
                <CardContent className="text-ink-2 italic">
                  Mandatory obligation — this is not a priority you set. It reflects the cost of
                  existing national debt and cannot be redirected.
                </CardContent>
              )}
              <CardContent className="text-ink-2">{fnData.description}</CardContent>
              {fnData.commonUses && fnData.commonUses.length > 0 && (
                <CardContent className="text-ink-2">
                  <ul>
                    {fnData.commonUses.map((use, i) => (
                      <li key={i} className="ml-4 list-disc">
                        {use}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          </CollapsibleContent>
        )}
      </Collapsible>
    </article>
  );
}
