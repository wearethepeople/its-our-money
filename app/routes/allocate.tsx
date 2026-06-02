import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useRef, useState } from "react";
import { data, href, redirect, useActionData, useLoaderData } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";

import { ErrorList } from "@/components/forms";
import { ViewSchemeToggle } from "@/components/view-scheme-toggle.tsx";
import { FUNCTIONS } from "@/constants/budget-functions.ts";
import { PUBLIC_DOMAIN_SCHEME, type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { Icon } from "@/ui/icon";
import { ConformSlider } from "@/ui/conform-slider.tsx";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { checkHoneypot } from "@/utils/honeypot.server";
import { normalizeToBasisPoints, sum } from "@/utils/normalize-weights.ts";
import {
  getOrCreateParticipantSession,
  getParticipantBySession,
} from "@/utils/participant-session.server.ts";

import { type Route } from "./+types/allocate";
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

const formSchema = z.object({
  allocations: z.array(
    z.object({
      id: z.string(),
      weight: z.coerce
        .number()
        .int()
        .min(1, "Every outlay function must have an allocation.")
        .max(1000),
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

  return redirect(href("/juxtapose"), { headers });
}

export default function AllocateRoute() {
  const actionData = useActionData<typeof action>();
  const { existingAllocation } = useLoaderData<typeof loader>();
  const allocatableCategories = FUNCTIONS.filter((f) => f.allocatable !== false);
  const [viewScheme, setViewScheme] = useState<ViewSchemeId>("flat");

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
          existingBps === undefined ? 0 : Math.min(1000, Math.max(1, Math.round(existingBps / 10)));
        return [c.id, weight];
      }),
    ),
  );

  const [form, fields] = useForm<AllocationFormInput>({
    defaultValue: {
      allocations: allocatableCategories.map((c) => {
        const existingBps = existingAllocationByCategoryId.get(c.id);

        if (existingBps === undefined) {
          return { id: c.id, weight: 0 };
        }

        return {
          id: c.id,
          weight: Math.min(1000, Math.max(1, Math.round(existingBps / 10))),
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

  const renderAllocationItem = (a: (typeof allocations)[number]) => {
    const categoryField = a.getFieldset();
    const fnId = categoryField.id.initialValue;
    if (fnId === undefined) return null;
    const fnData = getFunctionDetailsById(fnId);

    // className="even:[&>section]:bg-muted flex w-full flex-col"
    return (
      <article key={fnId}>
        <Collapsible className="flex flex-col">
          <h3 className="">
            <CollapsibleTrigger className="text-left text-ink-2 data-panel-open:text-you underline decoration-dotted decoration-you underline-offset-2 hover:cursor-pointer">
              {fnData?.name}
            </CollapsibleTrigger>
          </h3>
          <div className="flex flex-col">
            <ConformSlider
              meta={categoryField.weight}
              value={sliderWeights[fnId] ?? 0}
              onValueChange={(v) => setSliderWeights((prev) => ({ ...prev, [fnId]: v }))}
              min={0}
              max={1000}
              step={5}
              ariaLabel="Category weight"
            />
            <input
              {...getInputProps(categoryField.id, {
                type: "hidden",
              })}
            />
            <ErrorList id={categoryField.weight.errorId} errors={categoryField.weight.errors} />
          </div>
          <CollapsibleContent>
            <Card className="bg-surface-3 border-accent">
              <CardTitle className="px-4 uppercase">What this pays for</CardTitle>
              <CardContent className="text-ink-faint">{fnData?.description}</CardContent>
              {fnData?.commonUses && fnData.commonUses.length > 0 && (
                <CardContent>
                  <ul>
                    {fnData.commonUses.map((use, i) => (
                      <li key={i} className="ml-4 list-disc">{use}</li>
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

  const renderNetInterestItem = () => {
    const fnData = getFunctionDetailsById("net_interest");
    if (!fnData) return null;

    return (
      <article className="flex w-full flex-col">
        <div className="bg-secondary flex border border-gray-600">
          <h3 className="flex grow items-center gap-2 p-1 pl-2 font-extrabold">
            <Icon name="lock-closed" className="shrink-0 text-gray-400" />
            {fnData.name}
          </h3>
        </div>
        <section className="ml-auto w-[95%] border-x border-b border-gray-600">
          <div className="flex">
            <div className="grow px-6 py-4">
              <p className="text-muted-foreground mb-3 text-sm italic">
                Mandatory obligation — this is not a priority you set. It reflects the cost of
                existing national debt and cannot be redirected.
              </p>
              <p className="text-sm">{fnData.description}</p>
            </div>
            <cite className="flex shrink flex-col border-gray-600">
              <div>
                <div className="border-b border-l border-gray-600">
                  <p className="px-2 text-center text-sm font-semibold">Code</p>
                </div>
                <div>
                  <p className="border-b border-l border-gray-600 py-1 text-center text-xs">
                    {fnData.code}
                  </p>
                </div>
              </div>
            </cite>
          </div>
        </section>
      </article>
    );
  };

  return (
    <section ref={contentRef}>
      <form method="post" {...getFormProps(form)}>
        <HoneypotInputs />
        {/* Legend + toggle */}
        <div className="my-4 flex flex-row gap-8">
          <div className="flex grow">
            <div>Less</div>
            <div className="bg-accent grow"></div>
            <div>More</div>
          </div>
          <ViewSchemeToggle value={viewScheme} onChange={setViewScheme} />
        </div>
        {/* Sticky header */}
        <Progress
          value={progress * 100}
          className="py-4 sticky top-(--header-height) bg-background z-10"
        />
        {/* Allocations */}
        <div className="mx-0.5">
          {viewScheme === "flat" ? (
            <>
              <AllocationCard>{allocations.map((a) => renderAllocationItem(a))}</AllocationCard>
              <div className="mt-6">{renderNetInterestItem()}</div>
            </>
          ) : (
            <div className="flex flex-col gap-6">
              {PUBLIC_DOMAIN_SCHEME.groups.map((group) => (
                <div key={group.id}>
                  <div className={cn("uppercase", group.color)}>{group.label}</div>
                  <AllocationCard>
                    {group.functionIds.map((fid) => {
                      const entry = allocationsByFunctionId.get(fid);
                      if (!entry) return null;
                      return renderAllocationItem(entry.field);
                    })}
                  </AllocationCard>
                </div>
              ))}
              {renderNetInterestItem()}
            </div>
          )}
        </div>
        <div ref={sentinelRef} />
        <ErrorList id={form.errorId} errors={form.errors} />
        <div className="border-primary mt-8 flex items-center justify-between gap-8 rounded-md border p-4">
          <p>
            Your priorities will be scaled to percentages so your choices and Washington's budget
            share the same measure — then you can see where you agree, and where you don't.
          </p>
          <button
            type="submit"
            className="font-inherit m-0 flex h-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base leading-6 font-medium text-gray-900 outline-0 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:border-t-gray-300 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] data-[disabled]:text-gray-500 hover:data-[disabled]:bg-gray-50 active:data-[disabled]:border-t-gray-200 active:data-[disabled]:bg-gray-50 active:data-[disabled]:shadow-none"
          >
            Compare to D.C.'s
          </button>
        </div>
      </form>
    </section>
  );
}

function AllocationCard({ children }: React.PropsWithChildren) {
  return <Card className="bg-surface-2 border p-4">{children}</Card>;
}
