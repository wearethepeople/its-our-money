import { Route } from "./+types/juxtapose";
import { getParticipantBySession } from "@/utils/participant-session.server.ts";
import { href, redirect, Form, data, Link } from "react-router";
import { Button } from "@/ui/button.tsx";
import { getFormProps, useForm } from "@conform-to/react";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { getSessionId } from "@/utils/session.server.ts";
import {
  AllocationService,
  AllocationServiceServer,
} from "@/services/allocation-service.server.ts";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { checkHoneypot } from "@/utils/honeypot.server.ts";
import { ParticipantService } from "@/services/participant-service.server.ts";
import { getOmbBudgetByCodeForYear } from "@/utils/budget-data.ts";
import { useState } from "react";
import { TypographyH1, TypographyLead, TypographyP } from "#app/components/ui/typography.tsx";
import { Card } from "#app/components/ui/card.tsx";
import { AllocationViewer } from "@/components/allocation-viewer.tsx";
import { Separator } from "#app/components/ui/separator.tsx";

const manageAllocationSchema = z.object({
  intent: z.enum(["publish", "unpublish"]),
  allocationId: z.string(),
});

const inputFormSchema = manageAllocationSchema.omit({
  allocationId: true,
});

export async function loader({ request }: Route.LoaderArgs) {
  const participant = await getParticipantBySession(request);
  const url =
    process.env.NODE_ENV === "production" ? "https://itsourmoney.org" : "http://localhost:3000";

  if (participant) {
    const allocation = await AllocationService.getAllocationByParticipantId(participant.id);

    if (allocation) {
      const pairedData = await AllocationService.zipAllocationWithUsFiscalBudget(allocation);

      const ombData = getOmbBudgetByCodeForYear(2025);
      const netInterestBps = ombData["net_interest"]?.bps ?? 0;

      return { allocation, pairedData, url, netInterestBps, ombYear: 2025 };
    }
  }

  return redirect(href("/allocate/:year", { year: new Date().getFullYear().toString() }));
}

export async function action({ request }: Route.ActionArgs) {
  const sessionId = await getSessionId(request);
  const participant = await ParticipantService.getParticipantBySessionId(sessionId);

  if (!participant) {
    return data({
      resultType: "error" as const,
      result: {
        status: "error" as const,
        error: {
          "": ["Unable to identify participant."],
        },
      },
    });
  }

  const allocation = await AllocationService.getAllocationByParticipantId(participant.id);

  if (!allocation) {
    return data({
      resultType: "error" as const,
      result: {
        status: "error" as const,
        error: {
          "": ["Unable to fetch allocation."],
        },
      },
    });
  }

  const allocationOwnedByParticipant = allocation.participantId === participant.id;
  const allocationId = allocation.id;

  const formData = await request.formData();
  await checkHoneypot(formData);
  formData.set("allocationId", allocationId);

  const submission = parseWithZod(formData, {
    schema: manageAllocationSchema,
  });

  if (submission.status !== "success" || !allocationOwnedByParticipant) {
    const formError = !allocationOwnedByParticipant
      ? "You do not own this allocation."
      : "Unable to process allocation.";

    return data({
      resultType: "error" as const,
      result: submission.reply({
        formErrors: [formError],
      }),
    });
  }

  switch (submission.value.intent) {
    case "unpublish": {
      await AllocationService.unpublishAllocation(allocationId);

      return data(
        {
          resultType: "success" as const,
          result: submission.reply(),
        },
        { status: 200 },
      );
    }
    case "publish": {
      try {
        await AllocationService.publishAllocation(allocationId);

        return data(
          {
            resultType: "success" as const,
            result: submission.reply(),
          },
          { status: 200 },
        );
      } catch (error) {
        if (error instanceof AllocationServiceServer) {
          if (error.code === "PUBLIC_ID_COLLISION") {
            return data({
              resultType: "error" as const,
              result: submission.reply({
                formErrors: [
                  "Unable to publish allocation due to a collision with another allocation. Please try again.",
                ],
              }),
            });
          }
        }
      }
    }
  }

  return data({
    resultType: "error" as const,
    result: submission.reply({
      formErrors: ["Unable to process allocation."],
    }),
  });
}

export default function JuxtaposeRoute({ actionData, loaderData }: Route.ComponentProps) {
  const { allocation, pairedData, url, netInterestBps, ombYear } = loaderData;
  const lastResult = actionData?.result;
  const publishState = allocation.publicId && allocation.publishedAt ? "Published" : "Unpublished";
  const publishButtonText = publishState === "Published" ? "Unpublish" : "Publish";

  const [form, fields] = useForm({
    defaultValue: {
      intent: publishButtonText.toLowerCase(),
    },
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: inputFormSchema });
    },
    constraint: getZodConstraint(inputFormSchema),
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex-1 space-y-3">
          <TypographyH1>Where your priorities land.</TypographyH1>
          <TypographyLead>Not a budget. A statement of priorities.</TypographyLead>
          <TypographyP>Your preferences, next to what Washington actually spent.</TypographyP>
          <TypographyP>
            When you moved the sliders, you distributed your priorities across the 18 allocatable
            federal budget functions. Those choices were converted into percentages, your personal
            allocation, and are shown here alongside the government's actual spending from the most
            recent OMB data.
          </TypographyP>
          <TypographyP>
            Use the <strong>Comparison</strong> tab to see where you and the federal government
            align or diverge — sort by difference to find where your priorities diverge most. The{" "}
            <strong>Tax Breakdown</strong> tab translates those percentages into dollar amounts
            based on your federal tax payment, making the abstract concrete.
          </TypographyP>
          <TypographyP>
            If you decide to publish, this page is exactly what gets shared: your percentage
            breakdown, nothing more. No name, no identifying information — just your priorities.
          </TypographyP>
          <p className="text-sm text-you">
            Want to change your numbers?{" "}
            <Link
              to={href("/allocate/:year", {
                year: new Date().getFullYear().toString(),
              })}
            >
              Go back to the sliders
            </Link>
            .
          </p>
        </div>
      </div>
      <Card className="flex shrink-0 flex-row gap-4 rounded-lg border p-4">
        <div>
          <Form method="post" {...getFormProps(form)}>
            <HoneypotInputs />
            <input type="hidden" name="intent" value={publishButtonText.toLowerCase()} />
            <Button>{publishButtonText}</Button>
          </Form>
          <div id={form.errorId} className="mb-2 text-sm text-red-500">
            {form.errors}
          </div>
        </div>
        <div>
          <p className="mb-1 text-base">
            Your allocation is <strong className="font-semibold">{publishState}</strong>.
          </p>
          {allocation.publicId && publishState === "Published" && (
            <div className="mt-3">
              <ShareInfo publicId={allocation.publicId} url={url} />
            </div>
          )}
        </div>
      </Card>
      <Separator className="my-6" />
      <AllocationViewer pairedData={pairedData} netInterestBps={netInterestBps} ombYear={ombYear} />
    </div>
  );
}

function ShareInfo({ publicId, url }: { publicId: string; url: string }) {
  const shareUrl = `${url}/s/${publicId}`;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <p className="mb-2">Share this link with your friends to see how they compare to you:</p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          type="text"
          value={shareUrl}
          className="bg-muted min-w-0 flex-1 rounded border px-3 py-1.5 text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </>
  );
}
