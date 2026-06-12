import { useMemo, useState, useEffect } from "react";
import type { PairedItem } from "@/components/comparison.tsx";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "#app/components/ui/carousel.tsx";
import { cn } from "@/utils/misc.tsx";
import { InsightCard } from "@/components/insight-cards.tsx";
import { computeInsights, insightApplies, type InsightId } from "@/utils/insights.ts";

const CAROUSEL_INSIGHTS: InsightId[] = [
  "biggest-departures",
  "rank-flip",
  "nearly-zeroed-out",
  "agreements",
  "closest-call",
  "concentrated-bet",
];

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

  const insights = useMemo(() => computeInsights(pairedData), [pairedData]);

  return (
    <div className="relative px-8 -mx-8 mb-8">
      <Carousel opts={{ align: "start" }} setApi={setApi} className="w-full">
        <CarouselContent className="-ml-3">
          {CAROUSEL_INSIGHTS.filter((id) => insightApplies(id, insights)).map((id) => (
            <CarouselItem
              key={id}
              className="pl-3 basis-[85%] sm:basis-3/4 md:basis-1/2 lg:basis-1/3"
            >
              <InsightCard id={id} insights={insights} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-6" />
        <CarouselNext className="-right-6" />
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
