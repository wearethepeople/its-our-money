// This is called a "splat route" and as it's in the root `/app/routes/`
// directory, it's a catchall. If no other routes match, this one will and we
// can know that the user is hitting a URL that doesn't exist. By throwing a
// 404 from the loader, we can force the error boundary to render which will
// ensure the user gets the right status code and we can display a nicer error
// message for them than the Remix and/or browser default.

import { href, Link, redirect } from "react-router";
import { GeneralErrorBoundary } from "@/components/error-boundary.tsx";
import { Icon } from "@/components/ui/icon.tsx";
import { TypographyH1, TypographyLead } from "@/components/ui/typography.tsx";

import { type Route } from "./+types/$";

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const currentYear = new Date().getFullYear().toString();

  if (pathname.startsWith("/priorities")) {
    return redirect(href("/priorities/:year", { year: currentYear }));
  }

  throw new Response("Not found", { status: 404 });
}

export function action() {
  throw new Response("Not found", { status: 404 });
}

export default function NotFound() {
  // due to the loader, this component will never be rendered, but we'll return
  // the error boundary just in case.
  return <ErrorBoundary />;
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: () => (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <TypographyH1>Not found</TypographyH1>
              <TypographyLead>We could not find the requested resource.</TypographyLead>
            </div>
            <Link to="/" className="text-body-sm underline">
              <Icon name="arrow-left">Back to home</Icon>
            </Link>
          </div>
        ),
      }}
    />
  );
}
