import { cn } from "@/utils/misc.tsx";
import { Badge } from "@/ui/badge.tsx";
import { Button } from "@/ui/button.tsx";
import { ButtonGroup } from "@/ui/button-group.tsx";
import { PUBLIC_DOMAIN_SCHEME, type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { formatPercent, formatSignedCurrency, formatSignedPercent } from "@/utils/numbers.ts";

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
              {groupItems.map((item, index) => (
                <div key={item.code} className={index % 2 === 1 ? "bg-surface-2" : ""}>
                  <ComparisonRow item={item} maxPercent={maxPercent} badges={badges} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
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

export function ComparisonLegend({ ombYear, className }: { ombYear: number; className?: string }) {
  const fy = String(ombYear).slice(2);
  return (
    <div className={cn("bg-background mb-6 mt-4 flex items-center py-2 gap-5 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-you" />
        <span className="text-ink-muted">You</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-them" />
        <span className="text-ink-muted">Washington (FY{fy})</span>
      </div>
    </div>
  );
}

export function ComparisonRow({
  item,
  maxPercent,
  badges = "percent",
}: {
  item: PairedItem;
  maxPercent: number;
  badges?: "percent" | "none";
}) {
  const scale = maxPercent > 0 ? 100 / maxPercent : 1;
  return (
    <article className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{item.category}</span>
        {badges === "percent" && (
          <div className="flex shrink-0 items-center gap-1">
            <PercentBadge value={item.participantPercent} className="text-you" />
            <span className="text-xs text-muted-foreground">vs</span>
            <PercentBadge value={item.budgetPercent} className="text-them" />
            <DeltaBadge value={item.delta} />
          </div>
        )}
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
