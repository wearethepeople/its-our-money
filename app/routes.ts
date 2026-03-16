import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
	index('./routes/index.tsx'),
	route('allocate/:year', './routes/allocate.tsx'),
	route('juxtapose', './routes/juxtapose.tsx'),
	route('s/:publicId', './routes/share-allocation.route.tsx'),
	route('recover/:token', './routes/recovery.route.tsx'),
	route('resources/healthcheck', './routes/resources/healthcheck.tsx'),
	route('resources/images', './routes/resources/images.tsx'),
	route('resources/theme-switch', './routes/resources/theme-switch.tsx'),
	route('robots.txt', './routes/_seo/robots[.]txt.ts'),
	route('sitemap.xml', './routes/_seo/sitemap[.]xml.ts'),
	route('*', './routes/$.tsx'),
] satisfies RouteConfig
