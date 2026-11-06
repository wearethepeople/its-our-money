# Redirects

We handle redirects in Express. Incoming requests are handled by Express before
they pass through to Remix, so by redirecting earlier you improve performance.

## HTTP to HTTPS

Fly's edge forces all traffic to HTTPS (`force_https = true` on port 80 in
`fly.toml`), before a request reaches the app, so the app has no HTTPS
redirect of its own. wearethepeople.us and whatsyourtake.us do the same.

## Remove trailing slashes

We also remove trailing slashes automatically. A url like
`https://example.com/foo/` is automatically redirected to
`https://example.com/foo`.

This is important for SEO reasons, as website crawlers (like Google) treat these
as separate URLs and will consider them to be distinct pages with duplicate
content.

```ts
app.use((req, res, next) => {
  if (req.path.endsWith("/") && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
    res.redirect(301, safepath + query);
  } else {
    next();
  }
});
```

## www and the Fly hostname

`www.itsourmoney.us` and `its-our-money.fly.dev` are sent to
`https://itsourmoney.us` with a 301, keeping the path and query. The rule is
`canonicalHostRedirect` in `app/utils/seo.ts`, applied as the first middleware
in `server/index.ts`, so it covers static files too. The health check path is
never redirected, so Fly's checks pass on any host.

[DNS level redirects do not work with Fly](https://community.fly.io/t/how-to-redirect-from-non-www-to-www/5795/2),
so this has to live in the app. Both the apex and www need certificates
registered in Fly for traffic from either to reach it.
