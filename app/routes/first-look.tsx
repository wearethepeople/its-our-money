import { useEffect, useMemo, useState } from "react";
import { href, Link, redirect } from "react-router";
import { type Route } from "./+types/first-look";
import { getParticipantBySession } from "@/utils/participant-session.server.ts";
import { AllocationService } from "@/services/allocation-service.server.ts";
import { getOmbBudgetByCodeForYear } from "@/utils/budget-data.ts";
import { MAX_ALLOCATION_WEIGHT } from "@/constants/index.ts";
import { Button } from "@/ui/button.tsx";
import {
  ComparisonLegend,
  ComparisonList,
  sortPairedData,
  type SortDirection,
  type SortMode,
} from "@/components/comparison.tsx";
import { type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { TaxBreakdown } from "@/components/tax-breakdown.tsx";
import { InsightCard } from "@/components/insight-cards.tsx";
import { computeInsights, type InsightId } from "@/utils/insights.ts";
import { useLocalStorageState } from "@/hooks/use-local-storage-state.ts";
import { bpsToSliderWeight, percentToDisplayWeight } from "@/utils/normalize-weights.ts";
import { getFirstLookStep, setFirstLookStep } from "@/utils/first-look-progress.ts";
import { TypographyH1, TypographyLead, TypographyP } from "#app/components/ui/typography.tsx";
import { Separator } from "#app/components/ui/separator.tsx";
import { cn } from "@/utils/misc.tsx";
import {
  PercentsRoundingNote,
  WeightsRoundingNote,
} from "@/components/allocation-rounding-note.tsx";

const STEPS = ["weights", "percents", "insight-a", "tax"] as const;
type Step = (typeof STEPS)[number];

/** Which insight card shows at each interstitial. Both must always apply (see insightApplies). */
const INTERSTITIAL_INSIGHTS = {
  "insight-a": "biggest-departures",
  // "insight-b": "concentrated-bet",
} as const satisfies Partial<Record<Step, InsightId>>;

type ViewPrefs = {
  sortMode: SortMode;
  sortDirection: SortDirection;
  viewScheme: ViewSchemeId;
};

const DEFAULT_VIEW_PREFS: ViewPrefs = {
  sortMode: "participantPercent",
  sortDirection: "desc",
  viewScheme: "public_domain",
};

export async function loader({ request }: Route.LoaderArgs) {
  const participant = await getParticipantBySession(request);

  if (participant) {
    const allocation = await AllocationService.getAllocationByParticipantId(participant.id);

    if (allocation) {
      const pairedData = await AllocationService.zipAllocationWithUsFiscalBudget(allocation);

      const ombData = getOmbBudgetByCodeForYear(2025);
      const netInterestBps = ombData["net_interest"]?.bps ?? 0;

      return { pairedData, netInterestBps, ombYear: 2025 };
    }
  }

  return redirect(href("/priorities/:year", { year: new Date().getFullYear().toString() }));
}

export default function FirstLookRoute({ loaderData }: Route.ComponentProps) {
  const { pairedData, netInterestBps, ombYear } = loaderData;
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex] ?? "weights";

  // Restore mid-funnel progress on refresh; otherwise mark the funnel as
  // started so the rest of the app (e.g. the site nav) knows we're in it.
  useEffect(() => {
    const stored = getFirstLookStep();
    if (stored === null) {
      setFirstLookStep(0);
    } else {
      setStepIndex(Math.min(stored, STEPS.length - 1));
    }
  }, []);

  const goToStep = (i: number) => {
    setStepIndex(i);
    setFirstLookStep(i);
    window.scrollTo({ top: 0 });
  };

  const [viewPrefs, setViewPrefs] = useLocalStorageState(
    "first-look:view-prefs",
    DEFAULT_VIEW_PREFS,
  );

  const sortedPairedData = useMemo(
    () => sortPairedData(pairedData, viewPrefs.sortMode, viewPrefs.sortDirection),
    [pairedData, viewPrefs.sortMode, viewPrefs.sortDirection],
  );
  const insights = useMemo(() => computeInsights(pairedData), [pairedData]);

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
    () => sortPairedData(pairedDataWithNetInterest, viewPrefs.sortMode, viewPrefs.sortDirection),
    [pairedDataWithNetInterest, viewPrefs.sortMode, viewPrefs.sortDirection],
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

  const maxPercent = Math.max(
    ...sortedPairedDataWithNetInterest.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  const weightsMaxPercent = Math.max(
    ...weightedPairedData.map((d) => Math.max(d.participantPercent, d.budgetPercent)),
  );

  const back = () => goToStep(Math.max(stepIndex - 1, 0));
  const next = () => goToStep(Math.min(stepIndex + 1, STEPS.length - 1));

  const stepNav = (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 w-full place-content-between">
        {(stepIndex > 0 && (
          <Button
            variant="default"
            size="lg"
            className="py-5 bg-line border border-ink-faint text-ink-faint"
            onClick={back}
          >
            Back
          </Button>
        )) || <div></div>}
        {step !== "tax" && (
          <Button
            variant="default"
            size="lg"
            className="py-5 bg-line border border-ink-faint text-ink-faint"
            onClick={next}
          >
            Next
          </Button>
        )}
        {stepIndex + 1 === STEPS.length && <Link to={href("/comparison")}>Finish</Link>}
      </div>
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === stepIndex ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25",
            )}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div key={step} className="motion-safe:animate-slide-top">
        {step === "weights" && (
          <section>
            <TypographyH1 className="mb-3">Priorities, side by side.</TypographyH1>
            <Separator className="my-6" />
            <WeightsRoundingNote />
            <ComparisonLegend ombYear={ombYear} className="sticky top-(--header-height) z-10" />
            <ComparisonList
              items={weightedPairedData}
              maxPercent={weightsMaxPercent}
              viewScheme={viewPrefs.viewScheme}
              badges="none"
            />
          </section>
        )}
        {step === "insight-a" /*|| step === "insight-b"*/ && (
          <section className="mx-auto max-w-md py-12">
            <TypographyLead className="mb-6">
              {step === "insight-a"
                ? "Before moving on, one thing stands out."
                : "One more thing worth knowing."}
            </TypographyLead>
            <InsightCard id={INTERSTITIAL_INSIGHTS[step]} insights={insights} />
          </section>
        )}
        {step === "percents" && (
          <section>
            <TypographyH1 className="mb-3">Here's where you land.</TypographyH1>
            <Separator className="my-6" />
            <PercentsRoundingNote />
            <ComparisonLegend ombYear={ombYear} className="sticky top-(--header-height) z-10" />
            <ComparisonList
              items={sortedPairedDataWithNetInterest}
              maxPercent={maxPercent}
              viewScheme={viewPrefs.viewScheme}
            />
          </section>
        )}
        {step === "tax" && (
          <section>
            <TypographyH1 className="mb-3">Make it concrete.</TypographyH1>
            <TypographyLead className="mb-4">
              Percentages are abstract. Your tax bill isn't.
            </TypographyLead>
            <TaxBreakdown
              pairedData={sortedPairedData}
              netInterestBps={netInterestBps}
              viewScheme="flat"
              subject="you"
            />
          </section>
        )}
      </div>
      <div className="sticky bottom-0 mt-10 border-t border-ink-faint bg-background pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {stepNav}
      </div>
    </div>
  );
}
