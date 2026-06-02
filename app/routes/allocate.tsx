import { DrawerPreview as Drawer } from "@base-ui/react/drawer";
import { Dialog } from "@base-ui/react/dialog";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { type MouseEvent, useRef, useState } from "react";
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
import { getFunctionDetailsById, getOmbBudgetByCodeForYear } from "@/utils/budget-data.ts";
import { AllocationService } from "@/services/allocation-service.server.ts";
import { ParticipantService } from "@/services/participant-service.server.ts";
import type { FinalAllocationItem } from "@/services/participant-service.server.ts";
import { Card, CardContent, CardTitle } from "#app/components/ui/card.tsx";
import { Progress } from "#app/components/ui/progress.tsx";
import { cn } from "#app/utils/misc.tsx";
import { Button } from "#app/components/ui/button.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#app/components/ui/collapsible.tsx";

type OutlayDrawerPayload = {
  code: string;
  description: string;
  commonUses: string[];
  name: string;
};

type PreviewAllocation = {
  id: string;
  percent: number;
};

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

const SUMMARY_TRIGGER_ID = "summary";

export async function loader({ request }: Route.LoaderArgs) {
  const participant = await getParticipantBySession(request);
  const existingAllocation = participant
    ? await AllocationService.getAllocationByParticipantId(participant.id)
    : null;

  const ombData = getOmbBudgetByCodeForYear(2025);
  const netInterestBps = ombData["net_interest"]?.bps ?? 0;

  return data({ existingAllocation, netInterestBps });
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
  } catch (error) {
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

const normalizedDialogHandle = Dialog.createHandle();

export default function AllocateRoute() {
  const actionData = useActionData<typeof action>();
  const { existingAllocation, netInterestBps } = useLoaderData<typeof loader>();
  const outlaysDrawer = Drawer.createHandle<OutlayDrawerPayload>();
  const allocatableCategories = FUNCTIONS.filter((f) => f.allocatable !== false);
  const [viewScheme, setViewScheme] = useState<ViewSchemeId>("flat");

  const contentRef = useRef<HTMLElement>(null);
  const { sentinelRef, progress } = useScrollProgress(contentRef);

  const [previewAllocations, setPreviewAllocations] = useState<PreviewAllocation[]>([]);
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

  const handleFinalizeClick = (event: MouseEvent<HTMLButtonElement>) => {
    form.validate();

    const formElement = event.currentTarget.form;
    if (!formElement) return;

    const submission = parseWithZod(new FormData(formElement), {
      schema: formSchema,
    });

    if (submission.status === "success") {
      const basisPoints = normalizeToBasisPoints(
        submission.value.allocations.map((allocation) => allocation.weight),
      );

      if (basisPoints.length !== submission.value.allocations.length) return;

      const preview = submission.value.allocations.map((allocation, i) => {
        const bps = basisPoints[i];
        if (bps === undefined) {
          throw new Error(`Missing basis points at index ${i}`);
        }
        return {
          id: allocation.id,
          percent: bps / 100,
        };
      });
      setPreviewAllocations(preview);
      normalizedDialogHandle.open(SUMMARY_TRIGGER_ID);
    }
  };

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
              <CardTitle className="uppercase">What this pays for</CardTitle>
              <CardContent className="text-ink-faint">{fnData?.description}</CardContent>
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
          <div className="pr-2">
            <Drawer.Trigger
              className="shrink"
              handle={outlaysDrawer}
              payload={{
                code: fnData.code,
                description: fnData.description,
                commonUses: fnData.commonUses ?? [],
                name: fnData.name,
              }}
              title={fnData.name}
            >
              <Icon
                name="question-mark-circled"
                className="cursor-pointer text-gray-400 hover:text-gray-500"
              />
            </Drawer.Trigger>
          </div>
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
        <div className="py-4 flex flex-col sticky top-(--header-height) bg-background z-10">
          <div className="flex flex-row justify-between uppercase">
            <span>{viewScheme === "flat" ? "All sections" : "Section Title Here"}</span>
            <span> 1 of 17</span>
          </div>
          <Progress value={progress * 100} />
        </div>
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
        <ErrorList id={form.errorId} errors={form.errors} />
        <div className="border-primary mt-8 flex items-center justify-between gap-8 rounded-md border p-4">
          <div>
            <p>
              When you're finished prioritizing your budget, click the Finalize button and we'll
              turn your weighted allocations into percentages for your review.
            </p>
            <p>
              If you're happy with your allocations, you can proceed to the next step where you can
              compare your budget with the actual US fiscal budget.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFinalizeClick}
            className="font-inherit m-0 flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base leading-6 font-medium text-gray-900 outline-0 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:border-t-gray-300 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] data-[disabled]:text-gray-500 hover:data-[disabled]:bg-gray-50 active:data-[disabled]:border-t-gray-200 active:data-[disabled]:bg-gray-50 active:data-[disabled]:shadow-none"
          >
            Finalize
          </button>
        </div>
        <Dialog.Root handle={normalizedDialogHandle} triggerId={SUMMARY_TRIGGER_ID}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute dark:opacity-70" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 flex max-h-[calc(100dvh-2rem)] w-lg max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
              <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
                Your allocations as percentages
              </Dialog.Title>
              <Dialog.Description className="mb-6 text-base text-gray-600">
                Your allocations have been converted to percentages and are shown below. If you want
                to make changes click the "Keep working" button otherwise click "Submit" to see how
                your budget compares to the actual US budget.
              </Dialog.Description>
              <div className="min-h-0 overflow-y-auto pr-1">
                {previewAllocations.map((allocation) => {
                  const data = getFunctionDetailsById(allocation.id);

                  return (
                    <div className="even:[&>div]:bg-muted-foreground" key={allocation.id}>
                      <div className="flex items-center p-2">
                        <strong className="grow">{data?.name}</strong>
                        <span>{allocation.percent}%</span>
                      </div>
                    </div>
                  );
                })}
                {netInterestBps > 0 && (
                  <p className="mt-2 border-t border-gray-300 pt-3 text-sm text-gray-500 italic">
                    Before any of these priorities are funded, {Math.round(netInterestBps / 100)}{" "}
                    cents of every federal dollar is already committed to Net Interest — mandatory
                    debt service on the national debt. Your allocations above apply to the remaining{" "}
                    {100 - Math.round(netInterestBps / 100)} cents.
                  </p>
                )}
              </div>
              <div ref={sentinelRef} />
              <div className="mt-8 flex shrink-0 justify-end gap-4">
                <Dialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                  Keep Working
                </Dialog.Close>
                <input
                  type="submit"
                  title={"Submit allocations"}
                  className="border border-red-500"
                  form={form.id}
                  value={"Submit allocations"}
                />
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </form>
      <Drawer.Root handle={outlaysDrawer}>
        {({ payload }) => {
          return (
            <Drawer.Portal>
              <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] [--bleed:3rem] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute dark:[--backdrop-opacity:0.7]" />
              <Drawer.Viewport className="fixed inset-0 flex items-end">
                <Drawer.Popup className="duration-450ms -mb-12 max-h-[calc(80vh+3rem)] w-full transform-[translateY(var(--drawer-swipe-movement-y))] touch-auto overflow-y-auto overscroll-contain rounded-t-2xl bg-gray-50 px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+3rem)] text-gray-900 outline outline-gray-200 transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:transform-[translateY(calc(100%-3rem))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:transform-[translateY(calc(100%-3rem))] data-swiping:select-none dark:outline-gray-300">
                  <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
                  <Drawer.Content className="mx-auto w-full max-w-208">
                    <Drawer.Title className="mb-1 text-lg font-medium">
                      {payload?.code}: {payload?.name}
                    </Drawer.Title>
                    <Drawer.Description className="mb-6 text-base text-gray-600">
                      {payload?.description}
                    </Drawer.Description>
                    <ul>
                      {payload?.commonUses.map((use, i) => (
                        <li className="ml-8 list-disc" key={i}>
                          {use}
                        </li>
                      ))}
                    </ul>
                    <div className="hidden justify-end gap-4 md:flex">
                      <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                        Close
                      </Drawer.Close>
                    </div>
                  </Drawer.Content>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          );
        }}
      </Drawer.Root>
    </section>
  );
}

function AllocationCard({ children }: React.PropsWithChildren) {
  return <Card className="bg-surface-2 border p-4">{children}</Card>;
}

function AllocationDots({ filled = 0.5, max = 5 }: { filled?: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => {
        const position = i + 1;
        const state: "full" | "half" | "empty" =
          filled >= position ? "full" : filled >= position - 0.5 ? "half" : "empty";
        return (
          <div
            key={i}
            className={cn(
              "size-3 rounded-full border-2 border-you",
              state === "full" && "bg-you",
              state === "half" &&
                "bg-[linear-gradient(to_right,var(--color-you)_50%,transparent_50%)]",
            )}
          />
        );
      })}
    </div>
  );
}
