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
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyLead,
  TypographyP,
} from "#app/components/ui/typography.tsx";
import { Card, CardContent, CardTitle } from "#app/components/ui/card.tsx";
import { AllocationViewer } from "@/components/allocation-viewer.tsx";
import { Separator } from "#app/components/ui/separator.tsx";
import { Copy } from "lucide-react";
import { InsightCarousel } from "@/components/insight-carousel.tsx";

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
            Want to change your numbers?
            <br />
            <Link
              to={href("/allocate/:year", {
                year: new Date().getFullYear().toString(),
              })}
            >
              Go back to your allocation
            </Link>
            .
          </p>
        </div>
      </div>
      <Card className="rounded-lg border p-4">
        <CardTitle>
          Your allocation is{" "}
          <Form method="post" {...getFormProps(form)} className="inline">
            <HoneypotInputs />
            <input type="hidden" name="intent" value={publishButtonText.toLowerCase()} />
            <Button type="submit" size="xs">
              {publishState}
            </Button>
          </Form>
        </CardTitle>
        <CardContent>
          {allocation.publicId && publishState === "Published" && (
            <div className="mt-3">
              <ShareInfo publicId={allocation.publicId} url={url} />
            </div>
          )}
          <div id={form.errorId} className="mb-2 text-sm text-red-500">
            {form.errors}
          </div>
        </CardContent>
      </Card>
      <TypographyH2 className="border-b border-b-muted-foreground mt-12 mb-6">
        Insights
      </TypographyH2>
      <InsightCarousel pairedData={pairedData} />
      <TypographyH2 className="border-b border-b-muted-foreground">The numbers</TypographyH2>
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
      <p className="mb-4">Share and see where you agree.</p>
      <div className="flex gap-2">
        <input
          readOnly
          type="text"
          value={shareUrl}
          onClick={handleCopy}
          onFocus={(e) => e.currentTarget.select()}
          className="bg-muted block w-full cursor-pointer rounded border border-line px-3 py-1.5 text-sm"
          title={copied ? "Copied!" : "Click to copy"}
        />
        <Button variant="outline" onClick={handleCopy} className="bg-line">
          <Copy />
        </Button>
      </div>
    </>
  );
}
