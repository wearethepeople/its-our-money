import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("./routes/index.tsx"),
  route("priorities/:year", "./routes/priorities.tsx"),
  route("comparison", "./routes/comparison.tsx"),
  route("first-look", "./routes/first-look.tsx"),
  route("about", "./routes/about.tsx"),
  route("privacy", "./routes/privacy.tsx"),
  route("help", "./routes/help.tsx"),
  route("whats-next", "./routes/whats-next.tsx"),
  route("s/:publicId", "./routes/share-allocation.route.tsx"),
  route("recover/:token", "./routes/recovery.route.tsx"),
  route("resources/healthcheck", "./routes/resources/healthcheck.tsx"),
  route("resources/theme-switch", "./routes/resources/theme-switch.tsx"),
  route("robots.txt", "./routes/_seo/robots[.]txt.ts"),
  route("sitemap.xml", "./routes/_seo/sitemap[.]xml.ts"),
  route("*", "./routes/$.tsx"),
] satisfies RouteConfig;
