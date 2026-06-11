import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useRef, useState } from "react";
import { data, href, redirect, useActionData, useLoaderData } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";

import { ErrorList } from "@/components/forms";
import { ViewToggle } from "@/components/view-toggle.tsx";
import { MAX_ALLOCATION_WEIGHT } from "@/constants/index.ts";
import { FUNCTIONS } from "@/constants/budget-functions.ts";
import { PUBLIC_DOMAIN_SCHEME, type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { Icon } from "@/ui/icon";
import { ConformSlider } from "@/ui/conform-slider.tsx";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { checkHoneypot } from "@/utils/honeypot.server";
import { bpsToSliderWeight, normalizeToBasisPoints, sum } from "@/utils/normalize-weights.ts";
import {
  getOrCreateParticipantSession,
  getParticipantBySession,
} from "@/utils/participant-session.server.ts";

import { type Route } from "./+types/priorities";
import { getFunctionDetailsById } from "@/utils/budget-data.ts";
import { AllocationService } from "@/services/allocation-service.server.ts";
import { ParticipantService } from "@/services/participant-service.server.ts";
import type { FinalAllocationItem } from "@/services/participant-service.server.ts";
import { Card, CardContent, CardTitle } from "#app/components/ui/card.tsx";
import { Progress } from "#app/components/ui/progress.tsx";
import { cn } from "#app/utils/misc.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#app/components/ui/collapsible.tsx";
import {
  TypographyH1,
  TypographyLead,
  TypographyH2,
  TypographyP,
} from "#app/components/ui/typography.tsx";
import { Button } from "#app/components/ui/button.tsx";
import { Separator } from "#app/components/ui/separator.tsx";

const formSchema = z.object({
  allocations: z.array(
    z.object({
      id: z.string(),
      weight: z.coerce
        .number()
        .int()
        .min(1, "Every outlay function must have an allocation.")
        .max(MAX_ALLOCATION_WEIGHT),
    }),
  ),
});

export type AllocationFormInput = z.infer<typeof formSchema>;

export async function loader({ request }: Route.LoaderArgs) {
  const participant = await getParticipantBySession(request);
  const existingAllocation = participant
    ? await AllocationService.getAllocationByParticipantId(participant.id)
    : null;

  return data({ existingAllocation });
}

export async function action({ request }: Route.ActionArgs) {
  const isFirstTime = (await getParticipantBySession(request)) === null;
  const { headers, participantId } = await getOrCreateParticipantSession(request);
  const formData = await request.formData();
  await checkHoneypot(formData);

  const submission = parseWithZod(formData, { schema: formSchema });

  if (submission.status !== "success") {
    return data(
      {
        resultType: "error",
        result: submission.reply({
          formErrors: ["There was a problem processing your allocations."],
        }),
      },
      { headers, status: 400 },
    );
  }

  const weights = submission.value.allocations.map((a) => a.weight);
  const basisPoints = normalizeToBasisPoints(weights);
  let finalAllocation: FinalAllocationItem[];

  try {
    if (basisPoints.length !== submission.value.allocations.length) {
      throw new Error("Normalization output length mismatch");
    }

    finalAllocation = submission.value.allocations.map((allocation, i) => {
      const bps = basisPoints[i];

      if (bps === undefined) {
        throw new Error(`Missing basis points at index ${i}`);
      }

      return { id: allocation.id, bps };
    });
  } catch {
    return data(
      {
        resultType: "error",
        result: submission.reply({
          formErrors: ["Unable to normalize allocations."],
        }),
      },
      { headers, status: 400 },
    );
  }

  // Ensure the basis points sum to 10,000
  if (sum(finalAllocation.map((a) => a.bps)) !== 10000) {
    return data(
      {
        resultType: "error",
        result: submission.reply({
          formErrors: ["Unable to normalize allocations."],
        }),
      },
      { headers, status: 400 },
    );
  }

  await ParticipantService.saveParticipantAllocations({
    participantId,
    allocations: finalAllocation,
  });

  return redirect(isFirstTime ? href("/first-look") : href("/juxtapose"), { headers });
}

export default function PrioritiesRoute() {
  const actionData = useActionData<typeof action>();
  const { existingAllocation } = useLoaderData<typeof loader>();
  const allocatableCategories = FUNCTIONS.filter((f) => f.allocatable !== false);
  const [viewScheme, setViewScheme] = useState<ViewSchemeId>("public_domain");

  const contentRef = useRef<HTMLElement>(null);
  const { sentinelRef, progress } = useScrollProgress(contentRef);

  const existingAllocationByCategoryId = new Map(
    existingAllocation?.items.map((item) => [item.categoryCode, item.weightBps]) ?? [],
  );

  const [sliderWeights, setSliderWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      allocatableCategories.map((c) => {
        const existingBps = existingAllocationByCategoryId.get(c.id);
        const weight =
          existingBps === undefined ? 1 : bpsToSliderWeight(existingBps, MAX_ALLOCATION_WEIGHT);
        return [c.id, weight];
      }),
    ),
  );

  const [form, fields] = useForm<AllocationFormInput>({
    defaultValue: {
      allocations: allocatableCategories.map((c) => {
        const existingBps = existingAllocationByCategoryId.get(c.id);

        if (existingBps === undefined) {
          return { id: c.id, weight: 1 };
        }

        return {
          id: c.id,
          weight: bpsToSliderWeight(existingBps, MAX_ALLOCATION_WEIGHT),
        };
      }),
    },
    lastResult: actionData?.result,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate: ({ formData }) => {
      return parseWithZod(formData, { schema: formSchema });
    },
  });
  const allocations = fields.allocations.getFieldList();

  const allocationsByFunctionId = new Map(
    allocations.flatMap((a, i) => {
      const fid = a.getFieldset().id.initialValue;
      return fid ? [[fid, { field: a, globalIndex: i }] as const] : [];
    }),
  );

  const functionTrackColorVar = new Map<string, string>(
    PUBLIC_DOMAIN_SCHEME.groups.flatMap((group) =>
      group.functionIds.map((fid) => [fid, group.color.replace(/^text-/, "--")] as const),
    ),
  );

  const renderAllocationItem = (fnId: string, field?: (typeof allocations)[number]) => {
    const fnData = getFunctionDetailsById(fnId);
    if (!fnData) return null;
    const trackColorVar = functionTrackColorVar.get(fnId);
    const categoryField = field?.getFieldset();
    const isNetInterest = fnId === "net_interest";

    return (
      <article key={fnId}>
        <Collapsible className="flex flex-col gap-2">
          <h3>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-left text-ink-2 data-panel-open:text-you underline decoration-dotted decoration-you underline-offset-2 hover:cursor-pointer">
              {isNetInterest && (
                <Icon name="lock-closed" className="size-3.5 shrink-0 text-ink-faint" />
              )}
              {fnData.name}
            </CollapsibleTrigger>
          </h3>
          {categoryField && (
            <div className="flex flex-col mx-2">
              <ConformSlider
                meta={categoryField.weight}
                value={sliderWeights[fnId] ?? 1}
                onValueChange={(v) => setSliderWeights((prev) => ({ ...prev, [fnId]: v }))}
                min={1}
                max={MAX_ALLOCATION_WEIGHT}
                step={1}
                ariaLabel="Category weight"
                trackColorVar={trackColorVar}
              />
              <input {...getInputProps(categoryField.id, { type: "hidden" })} />
              <ErrorList id={categoryField.weight.errorId} errors={categoryField.weight.errors} />
            </div>
          )}
          <CollapsibleContent>
            <Card className="bg-surface-3 border-line-2 border-l-2 border-l-you/60 mt-4">
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
        </Collapsible>
      </article>
    );
  };

  return (
    <section ref={contentRef}>
      <div>
        <TypographyH1 className="mb-3">Your turn.</TypographyH1>
        <TypographyLead className="mb-8">
          Drag the sliders to match your priorities — where you'd put your money. You know your
          values, so no expertise required. Tap any title for context.
        </TypographyLead>
      </div>
      <form className="flex flex-col gap-4" method="post" {...getFormProps(form)}>
        <HoneypotInputs />
        {/* Legend + toggle */}
        <div className="py-4 sticky top-(--header-height) bg-background z-10">
          <div className="flex gap-4 items-center">
            <Progress value={progress * 100} className="grow" />
            <ViewToggle value={viewScheme} onChange={setViewScheme} />
          </div>
        </div>
        {/* Allocations */}
        <div className="mx-0.5">
          {viewScheme === "flat" ? (
            <AllocationCard>
              {allocations.map((a) => {
                const fnId = a.getFieldset().id.initialValue;
                return fnId ? renderAllocationItem(fnId, a) : null;
              })}
              {renderAllocationItem("net_interest")}
            </AllocationCard>
          ) : (
            <div className="flex flex-col gap-8">
              {PUBLIC_DOMAIN_SCHEME.groups.map((group) => (
                <div key={group.id}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                    <span
                      className="size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: `var(${group.color.replace(/^text-/, "--")})` }}
                    />
                    {group.label}
                  </h3>
                  <AllocationCard>
                    {group.functionIds.map((fid) => {
                      const entry = allocationsByFunctionId.get(fid);
                      if (!entry) return null;
                      return renderAllocationItem(fid, entry.field);
                    })}
                  </AllocationCard>
                </div>
              ))}
              <AllocationCard>{renderAllocationItem("net_interest")}</AllocationCard>
            </div>
          )}
        </div>
        <div ref={sentinelRef} />
        <ErrorList id={form.errorId} errors={form.errors} />
        <Separator className="my-8" />
        <div className="flex flex-col">
          {existingAllocation ? (
            <>
              <TypographyH2 className="mb-0">Fine-tuning?</TypographyH2>
              <TypographyLead className="mb-12">
                Adjust anything. Your updated priorities will replace the previous comparison.
              </TypographyLead>
            </>
          ) : (
            <>
              <TypographyH2 className="mb-0">How's that feel?</TypographyH2>
              <TypographyLead className="mb-12">
                Now that you've set your priorities, they'll be mapped against Washington's. See
                where you agree, and where you don't. Some of it might surprise you.
              </TypographyLead>
            </>
          )}
          <Button
            type="submit"
            className="h-10 border-ink border-2 bg-surface font-semibold mx-auto py-6 px-7 mb-4"
            variant="outline"
          >
            {existingAllocation ? "Update your comparison" : "See how your priorities compare"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function AllocationCard({ children }: React.PropsWithChildren) {
  return <Card className="bg-surface-2 border p-6">{children}</Card>;
}
