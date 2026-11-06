import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { SITE_ORIGIN } from "@/utils/seo.ts";
import { type Route } from "./+types/robots[.]txt.ts";

export function loader(_: Route.LoaderArgs) {
  return generateRobotsTxt([{ type: "sitemap", value: `${SITE_ORIGIN}/sitemap.xml` }]);
}
