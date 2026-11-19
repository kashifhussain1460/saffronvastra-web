# Deploying the storefront on Vercel

Next.js 15 (App Router). Deploy the API first: the site forwards `/api/v1/*`, `/uploads/*` and `/health/*` to it, and some
pages read the catalogue from it while they are built.

1. Vercel > Add New > Project > import the `saffronvastra-web` repo. Framework preset: Next.js. Node.js 22. No build settings to change.
2. Environment variables (see `.env.example`). They must be set **before the first build**, because the forwarding rules are fixed at build time. Change one and you must redeploy.

| Variable | Production | Preview |
|---|---|---|
| `API_ORIGIN` | the API project's https address, no trailing slash | the API's preview address or the same production API |
| `SITE_URL` | `https://www.saffronvastra.com` | leave empty |
| `ALLOW_INDEXING` | `true` | leave empty (keeps previews out of Google) |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | `4` (Vercel limits a request body to 4.5 MB) | `4` |

3. Add the custom domain, then put the same address in the API project as `CORS_ORIGIN` and `APP_URL`.
4. Sign-in cookies stay on the storefront's own domain because the browser only ever talks to the storefront; the API is reached through the forwarding rule.

## Checks after deploy

- `/` loads with products; `/auth/login` signs in; `/admin` opens for an admin account.
- A product image added in Admin > Media shows on the product page.
- `/robots.txt` says `Disallow: /` on previews and allows the site on production.
- `/sitemap.xml` lists products.
- Run the SEO smoke check: `cd D:\saff\qa && node scripts/seo-smoke-check.cjs`. It exits with an error if robots.txt
  blocks the site, a page that must be indexed has noindex or a wrong canonical, product structured data is broken,
  or the bare domain / http / `saffronvastra-web.vercel.app` do not redirect permanently to `https://www.`.

## Indexing, caching and preview

- **Indexing:** `ALLOW_INDEXING` decides when set. When it is missing, the Production deployment is indexable and
  previews are not (`VERCEL_ENV`), so losing the variable no longer takes the shop out of Google.
- **`*.vercel.app`:** on the Production deployment the middleware sends every page on a `.vercel.app` address to the
  same path on `SITE_URL` (308). Unique deployment URLs of production builds redirect too; use Preview deployments for
  testing.
- **Product and collection pages are cached (ISR):** rendered on the first visit, served from the edge, rebuilt at most
  once a minute (and never served more than an hour old, `expireTime` in `next.config.mjs`). Edits show within about a
  minute.
- **Preview mode for admins:** the admin "View on storefront" buttons open `/api/preview?path=…`, which checks the
  admin session and turns on Next.js draft mode for that browser: product and collection pages then render live with
  the admin session (Draft products included) and show a "Preview mode" bar with an Exit link.

## Known notes

- `npm audit --omit=dev` still reports a PostCSS issue bundled inside Next.js 15 (build-time tool, not part of what visitors run). The fix needs Next.js 16, a major upgrade to plan separately.
- Vercel Hobby is for personal, non-commercial use. A live shop belongs on Pro.
