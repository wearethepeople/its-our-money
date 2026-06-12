import { type ReactNode } from "react";
import { ArrowLeftRight, ArrowUpDown, ArrowDown, Equal, Target, Layers } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#app/components/ui/card.tsx";
import { DeltaBadge } from "@/components/comparison.tsx";
import { type ComputedInsights, type InsightId } from "@/utils/insights.ts";
import { formatPercent } from "@/utils/numbers.ts";

function MethodologyFooter({ children }: { children: ReactNode }) {
  return (
    <CardFooter className="border-t-muted-foreground mt-auto p-0 px-4 pb-4 group-data-[size=sm]/card:px-3">
      <p className="text-xs text-muted-foreground pt-2.5 min-h-18.5">{children}</p>
    </CardFooter>
  );
}

/**
 * A single standalone insight card. Returns null when the insight doesn't
 * apply (e.g. "rank-flip" when you and Washington agree on #1).
 */
export function InsightCard({ id, insights }: { id: InsightId; insights: ComputedInsights }) {
  const {
    top3,
    washingtonTop,
    yourRank,
    nearlyZeroedOut,
    surpriseAgreements,
    closestCall,
    yourTop3,
    yourTop3Share,
    washTop3Share,
  } = insights;

  switch (id) {
    case "biggest-departures":
      return (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start gap-2">
              <ArrowLeftRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <CardTitle>Your biggest departures</CardTitle>
                <p className="text-xs text-muted-foreground">from Washington</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {top3.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate min-w-0">{item.category}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      you'd pay {item.delta > 0 ? "more" : "less"}
                    </span>
                    <DeltaBadge value={item.delta} className="shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <MethodologyFooter>
            The three functions where your share differs most from Washington's, regardless of
            whether you'd spend more or less.
          </MethodologyFooter>
        </Card>
      );
    case "rank-flip": {
      if (!washingtonTop || yourRank === 1) return null;
      return (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start gap-2">
              <ArrowUpDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <CardTitle>The rank flip</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-1.5">{washingtonTop.category}</p>
            <p className="text-sm text-muted-foreground">
              Washington ranks it <strong className="text-them font-semibold">#1</strong>. You rank
              it <strong className="text-you font-semibold">#{yourRank}</strong>.
            </p>
          </CardContent>
          <MethodologyFooter>
            Compares the function Washington spends the most on against where you ranked it by the
            share of your budget you gave it.
          </MethodologyFooter>
        </Card>
      );
    }
    case "nearly-zeroed-out":
      return (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start gap-2">
              <ArrowDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <CardTitle>What you'd nearly zero out</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{nearlyZeroedOut?.category}</p>
          </CardContent>
          <MethodologyFooter>
            The function you assigned the smallest share of your budget to.
          </MethodologyFooter>
        </Card>
      );
    case "agreements":
      return (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start gap-2">
              <Equal className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <CardTitle>Where you agree with Washington</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {surpriseAgreements.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate min-w-0">{item.category}</span>
                  <DeltaBadge value={item.delta} className="shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
          <MethodologyFooter>
            Of the functions Washington spends at least 5% of the budget on, the three your
            allocation comes closest to matching.
          </MethodologyFooter>
        </Card>
      );
    case "closest-call":
      return (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start gap-2">
              <Target className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <CardTitle>The closest call</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {closestCall && (
              <>
                <p className="text-sm font-medium mb-1.5">{closestCall.category}</p>
                <p className="text-sm text-muted-foreground">
                  You allocated{" "}
                  <strong className="text-you font-semibold">
                    {closestCall.participantPercent.toFixed(1)}%
                  </strong>
                  . Washington spent{" "}
                  <strong className="text-them font-semibold">
                    {closestCall.budgetPercent.toFixed(1)}%
                  </strong>
                  . Gap: <DeltaBadge value={closestCall.delta} className="shrink-0" />
                </p>
              </>
            )}
          </CardContent>
          <MethodologyFooter>
            The smallest gap between your share and Washington's, limited to functions either of you
            allocated more than 1% of the budget to.
          </MethodologyFooter>
        </Card>
      );
    case "concentrated-bet":
      return (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start gap-2">
              <Layers className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <CardTitle>Your most concentrated bet</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 mb-3">
              {yourTop3.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate min-w-0">{item.category}</span>
                  <span className="text-sm font-mono text-you shrink-0">
                    {formatPercent(item.participantPercent)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground border-t pt-2.5">
              Your top 3 account for{" "}
              <strong className="text-you font-semibold">{formatPercent(yourTop3Share)}</strong> of
              your budget. Washington's top 3 account for{" "}
              <strong className="text-them font-semibold">{formatPercent(washTop3Share)}</strong>.
            </p>
          </CardContent>
          <MethodologyFooter>
            Your three highest-weighted functions and their combined share, set against the combined
            share of Washington's three highest-spending functions.
          </MethodologyFooter>
        </Card>
      );
  }
}
