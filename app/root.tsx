import { OpenImgContextProvider } from "openimg/react";
import {
  data,
  href,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "react-router";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { type Route } from "./+types/root.ts";
import appleTouchIconAssetUrl from "./assets/favicons/apple-touch-icon.png";
import faviconAssetUrl from "./assets/favicons/favicon.svg";
import { GeneralErrorBoundary } from "./components/error-boundary.tsx";
import { EpicProgress } from "./components/progress-bar.tsx";
import { useToast } from "./components/toaster.tsx";
import { Icon, href as iconsHref } from "./components/ui/icon.tsx";
import { EpicToaster } from "./components/ui/sonner.tsx";
import { ThemeSwitch, useOptionalTheme, useTheme } from "./routes/resources/theme-switch.tsx";
import tailwindStyleSheetUrl from "./styles/tailwind.css?url";
import { ClientHintCheck, getHints } from "./utils/client-hints.tsx";
import { getEnv } from "./utils/env.server.ts";
import { pipeHeaders } from "./utils/headers.server.ts";
import { honeypot } from "./utils/honeypot.server.ts";
import { cn, combineHeaders, getDomainUrl, getImgSrc } from "./utils/misc.tsx";
import { useNonce } from "./utils/nonce-provider.ts";
import { type Theme, getTheme } from "./utils/theme.server.ts";
import { makeTimings } from "./utils/timing.server.ts";
import { getToast } from "./utils/toast.server.ts";
import { getParticipantBySession } from "@/utils/participant-session.server.ts";
import { Separator } from "./components/ui/separator.tsx";
import { useElementHeightVar } from "@/hooks/use-element-height-var.ts";

export const links: Route.LinksFunction = () => {
  return [
    // Preload svg sprite as a resource to avoid render blocking
    { rel: "preload", href: iconsHref, as: "image" },
    {
      rel: "icon",
      href: "/favicon.ico",
      sizes: "48x48",
    },
    { rel: "icon", type: "image/svg+xml", href: faviconAssetUrl },
    { rel: "apple-touch-icon", href: appleTouchIconAssetUrl },
    {
      rel: "manifest",
      href: "/site.webmanifest",
      crossOrigin: "use-credentials",
    } as const, // necessary to make typescript happy
    { rel: "stylesheet", href: tailwindStyleSheetUrl },
  ].filter(Boolean);
};

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data ? `It’s Our Money` : "Error | It’s Our Money" },
    {
      name: "description",
      content: `It’s our money. A We (ARE) the People civic identity project.`,
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const timings = makeTimings("root loader");
  const { toast, headers: toastHeaders } = await getToast(request);
  const honeyProps = await honeypot.getInputProps();
  const participant = await getParticipantBySession(request);

  return data(
    {
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: getTheme(request),
        },
      },
      ENV: getEnv(),
      participant,
      toast,
      honeyProps,
    },
    {
      headers: combineHeaders({ "Server-Timing": timings.toString() }, toastHeaders),
    },
  );
}

export const headers: Route.HeadersFunction = pipeHeaders;

function Document({
  children,
  nonce,
  theme = "light",
  env = {},
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  env?: Record<string, string | undefined>;
}) {
  const allowIndexing = ENV.ALLOW_INDEXING !== "false";
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : <meta name="robots" content="noindex, nofollow" />}
        <Links />
      </head>
      <body
        className="bg-background text-foreground root"
        style={{ isolation: "isolate", position: "relative" }}
      >
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  // if there was an error running the loader, data could be missing
  const data = useLoaderData<typeof loader | null>();
  const nonce = useNonce();
  const theme = useOptionalTheme();
  return (
    <Document nonce={nonce} theme={theme} env={data?.ENV}>
      {children}
    </Document>
  );
}

function App() {
  const data = useLoaderData<typeof loader>();
  const theme = useTheme();
  const { pathname } = useLocation();
  const headerRef = useElementHeightVar<HTMLElement>("--header-height");
  const footerRef = useElementHeightVar<HTMLElement>("--footer-height");

  const isHome = pathname === "/";
  const isParticipant = data?.participant !== null;

  // Hide the site nav while the participant is mid-funnel in /first-look
  // (i.e. hasn't reached /comparison for the first time yet).
  const inFirstLook = data?.participant != null && data.participant.firstLookCompletedAt === null;

  useToast(data.toast);

  return (
    <OpenImgContextProvider optimizerEndpoint="/resources/images" getSrc={getImgSrc}>
      <a id="top" />
      <div className="mx-auto flex min-h-screen flex-col justify-between">
        <header
          className={cn(
            "bg-background border-b-muted-foreground border-b py-2 sticky top-0 z-10 mb-8",
            isHome && !isParticipant ? "" : "",
          )}
          ref={headerRef}
        >
          <nav
            className={cn(
              "container flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8",
              isParticipant ? "text-sm" : "text-4xl",
            )}
          >
            <div>
              <h1>
                <Link to="/" className="font-extrabold no-underline text-you">
                  It’s Our Money
                </Link>
              </h1>
            </div>
            {data.participant && !inFirstLook && (
              <div className="flex gap-4">
                <NavLink
                  to={href("/priorities/:year", {
                    year: new Date().getFullYear().toString(),
                  })}
                  end
                  className={({ isActive }) =>
                    isActive ? "underline font-semibold" : "text-ink-faint no-underline"
                  }
                >
                  Priorities
                </NavLink>
                <Separator orientation="vertical" />
                <NavLink
                  to={href("/comparison")}
                  end
                  className={({ isActive }) =>
                    isActive ? "underline font-semibold" : "text-ink-faint no-underline"
                  }
                >
                  Comparison
                </NavLink>
              </div>
            )}
          </nav>
        </header>

        <main className="container mx-auto flex w-full flex-1 flex-col justify-between">
          <Outlet />
        </main>

        <footer
          className="mt-8 py-4 border-t border-t-line-2 bg-surface text-ink-muted"
          ref={footerRef}
        >
          <div className="container flex justify-between flex-col sm:flex-row text-ink-muted">
            <ul className="text-sm flex gap-6 mb-8 sm:gap-2 sm:mb-auto">
              <li>
                <Link to={href("/about")}>About</Link>
              </li>
              <li>
                <Link to={href("/privacy")}>Privacy</Link>
              </li>
              <li>
                <Link to={href("/help")}>Help</Link>
              </li>
            </ul>
            <div className="flex flex-row sm:flex-col sm:grow sm:text-right">
              <div>
                <p className="text-sm leading-snug text-ink-muted sm:pr-2">
                  <Icon name="wrtp-01" size="md" className="mr-1" />
                  A&nbsp;
                  <Link
                    to="http://www.wearethepeople.us/"
                    target="_blank"
                    className="font-semibold"
                  >
                    We&nbsp;(ARE)&nbsp;the&nbsp;People
                  </Link>
                  &nbsp;project.
                </p>
                <p className="sm:mb-4">
                  <small className="text-ink-muted sm:pr-2">&copy; 2026 We (ARE) the People</small>
                </p>
              </div>
              <div className="flex grow place-content-end">
                <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
              </div>
            </div>
          </div>
        </footer>
      </div>
      <EpicToaster closeButton position="top-center" theme={theme} />
      <EpicProgress />
    </OpenImgContextProvider>
  );
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  );
}

export default AppWithProviders;

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary;
