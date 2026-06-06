import { Route } from "./+types/share-allocation.route";
import { invariant } from "@epic-web/invariant";
import { AllocationService } from "@/services/allocation-service.server.ts";
import { getOmbBudgetByCodeForYear } from "@/utils/budget-data.ts";
import { AllocationViewer } from "@/components/allocation-viewer.tsx";
import { Button } from "@/ui/button.tsx";
import { href, Link } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  invariant(params.publicId, "Missing publicId");

  const allocation = await AllocationService.getAllocationByPublicId(params.publicId);

  invariant(allocation, "Allocation not found");

  const pairedData = await AllocationService.zipAllocationWithUsFiscalBudget(allocation);

  const ombData = getOmbBudgetByCodeForYear(2025);
  const netInterestBps = ombData["net_interest"]?.bps ?? 0;

  return {
    allocation,
    pairedData,
    netInterestBps,
    ombYear: 2025,
  };
}

export default function ShareAllocationRoute({ loaderData, params }: Route.ComponentProps) {
  const { pairedData, netInterestBps, ombYear } = loaderData;

  return (
    <div>
      <AllocationViewer pairedData={pairedData} netInterestBps={netInterestBps} ombYear={ombYear} subject="they" />
      <BuildYourOwnBudget />
    </div>
  );
}

function BuildYourOwnBudget() {
  return (
    <div className="mt-12">
      <div className="flex flex-row">
        <div>
          Have you ever wondered why it is that you give the federal government your money, but you
          don't get to decide where it goes?
        </div>
        <Link to={href("/allocate/:year", { year: "2025" })}>
          <Button>Make your own budget</Button>
        </Link>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <h1>Unable to find that allocation</h1>
      <p>
        It's possible the person who shared it has since unpublished it or it never existed. Perhaps
        consider making your own budget and sharing it.
      </p>
      <BuildYourOwnBudget />
    </div>
  );
}
