import { useMemo, useState, useEffect, type ReactNode } from "react";
import { ArrowLeftRight, ArrowUpDown, ArrowDown, Equal, Target, Layers } from "lucide-react";
import type { PairedItem } from "./allocation-viewer.tsx";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "#app/components/ui/carousel.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#app/components/ui/card.tsx";
import { Badge } from "#app/components/ui/badge.tsx";
import { cn } from "@/utils/misc.tsx";
import { formatSignedPercent, formatPercent } from "@/utils/numbers.ts";

function MethodologyFooter({ children }: { children: ReactNode }) {
  return (
    <CardFooter className="mt-auto p-0 px-4 pb-4 group-data-[size=sm]/card:px-3">
      <p className="text-xs text-muted-foreground pt-2.5">{children}</p>
    </CardFooter>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const nearZero = Math.abs(value) < 0.2;
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 font-mono tabular-nums border-transparent",
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

export function InsightCarousel({ pairedData }: { pairedData: PairedItem[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

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
  } = useMemo(() => {
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
  }, [pairedData]);

  return (
    <div className="relative px-10 -mx-10 mb-8">
      <Carousel opts={{ align: "start" }} setApi={setApi} className="w-full">
        <CarouselContent className="-ml-3">
          <CarouselItem className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3">
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
                        <DeltaBadge value={item.delta} />
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
          </CarouselItem>

          {washingtonTop && yourRank !== 1 && (
            <CarouselItem className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3">
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
                    Washington ranks it <strong className="text-them font-semibold">#1</strong>. You
                    rank it <strong className="text-you font-semibold">#{yourRank}</strong>.
                  </p>
                </CardContent>
                <MethodologyFooter>
                  Compares the function Washington spends the most on against where you ranked it by
                  the share of your budget you gave it.
                </MethodologyFooter>
              </Card>
            </CarouselItem>
          )}

          <CarouselItem className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3">
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
          </CarouselItem>
          <CarouselItem className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3">
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
                      <DeltaBadge value={item.delta} />
                    </div>
                  ))}
                </div>
              </CardContent>
              <MethodologyFooter>
                Of the functions Washington spends at least 5% of the budget on, the three your
                allocation comes closest to matching.
              </MethodologyFooter>
            </Card>
          </CarouselItem>

          <CarouselItem className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3">
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
                      . Gap: <DeltaBadge value={closestCall.delta} />
                    </p>
                  </>
                )}
              </CardContent>
              <MethodologyFooter>
                The smallest gap between your share and Washington's, limited to functions either of
                you allocated more than 1% of the budget to.
              </MethodologyFooter>
            </Card>
          </CarouselItem>
          <CarouselItem className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3">
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
                  <strong className="text-you font-semibold">{formatPercent(yourTop3Share)}</strong>{" "}
                  of your budget. Washington's top 3 account for{" "}
                  <strong className="text-them font-semibold">
                    {formatPercent(washTop3Share)}
                  </strong>
                  .
                </p>
              </CardContent>
              <MethodologyFooter>
                Your three highest-weighted functions and their combined share, set against the
                combined share of Washington's three highest-spending functions.
              </MethodologyFooter>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="mt-3 flex justify-center items-center gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
