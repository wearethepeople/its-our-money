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
import { absoluteUrl, ORGANIZATION, ORGANIZATION_ID, SITE_NAME, SITE_ORIGIN } from "./utils/seo.ts";
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
    // Body (400) and H1 (800) weights; the rest are discovered after the CSS loads.
    // crossOrigin is required for font preloads to be reused.
    { rel: "preload", href: "/fonts/libre-franklin-400.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" } as const,
    { rel: "preload", href: "/fonts/libre-franklin-800.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" } as const,
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

const DESCRIPTION = "It’s our money. A We (ARE) the People civic identity project.";

// No route exports its own meta, so this applies site-wide. The canonical is
// built from the page's path, never the request URL, so query strings and
// non-canonical hosts never reach it.
export const meta: Route.MetaFunction = ({ loaderData, location }) => {
  const title = loaderData ? SITE_NAME : `Error | ${SITE_NAME}`;
  const url = absoluteUrl(location.pathname);
  return [
    { title },
    { name: "description", content: DESCRIPTION },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: url },
    { property: "og:image", content: absoluteUrl("/og.png") },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "It’s Our Money. A We (ARE) the People project." },
    { name: "twitter:card", content: "summary_large_image" },
    // Same WebSite + Organization @graph as the other WrTP sites, home only.
    ...(location.pathname === "/"
      ? [
          {
            "script:ld+json": {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_ORIGIN}/#website`,
                  url: `${SITE_ORIGIN}/`,
                  name: SITE_NAME,
                  description: DESCRIPTION,
                  publisher: { "@id": ORGANIZATION_ID },
                },
                { ...ORGANIZATION, sameAs: ["https://www.instagram.com/wrtp.us/"] },
              ],
            },
          },
        ]
      : []),
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
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
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

        {!inFirstLook && (
          <footer
            className="mt-8 py-4 border-t border-t-line-2 bg-surface text-ink-muted"
            ref={footerRef}
          >
            <div className="container flex justify-between flex-col sm:flex-row text-ink-muted">
              <div className="mb-8 sm:mb-auto">
                <ul className="text-sm flex gap-6 mb-2 sm:gap-2">
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
                <p>
                  <small className="text-ink-faint">&copy; 2026 We (ARE) the People</small>
                </p>
              </div>
              <div className="flex flex-row sm:flex-col sm:grow sm:text-right">
                <div>
                  <p className="text-sm leading-snug text-ink-muted sm:pr-2">
                    <Icon name="wrtp-01" size="md" className="mr-1" />
                    A&nbsp;
                    <Link to="https://wearethepeople.us" target="_blank" className="font-semibold">
                      We&nbsp;(ARE)&nbsp;the&nbsp;People
                    </Link>
                    &nbsp;project.
                  </p>
                  <div className="flex items-center gap-2 sm:mb-4 sm:justify-end sm:pr-2">
                    <a
                      href="https://www.instagram.com/wrtp.us/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="We (ARE) the People on Instagram (@wrtp.us)"
                      className="text-ink-faint hover:text-ink-muted"
                    >
                      <Icon name="instagram" size="sm" />
                    </a>
                    <a
                      href="mailto:info@wearethepeople.us"
                      className="text-xs text-ink-faint underline-offset-2 hover:text-ink-muted hover:underline"
                    >
                      info@wearethepeople.us
                    </a>
                  </div>
                </div>
                <div className="flex grow place-content-end">
                  <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
                </div>
              </div>
            </div>
          </footer>
        )}
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
