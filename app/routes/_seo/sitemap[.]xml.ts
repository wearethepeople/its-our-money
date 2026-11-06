import { generateSitemap } from "@nasa-gcn/remix-seo";
import { SITE_ORIGIN } from "@/utils/seo.ts";
import { serverBuildContext } from "@/utils/server-build-context.ts";
import { type Route } from "./+types/sitemap[.]xml.ts";

export async function loader({ request, context }: Route.LoaderArgs) {
  const serverBuild = context.get(serverBuildContext);
  // TODO: This is typeerror is coming up since of the remix-run/server-runtime package. We might need to remove/update that one.
  // @ts-expect-error
  return generateSitemap(request, serverBuild.routes, {
    siteUrl: SITE_ORIGIN,
    headers: {
      "Cache-Control": `public, max-age=${60 * 5}`,
    },
  });
}
