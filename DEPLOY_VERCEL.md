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

## Known notes

- `npm audit --omit=dev` still reports a PostCSS issue bundled inside Next.js 15 (build-time tool, not part of what visitors run). The fix needs Next.js 16, a major upgrade to plan separately.
- Vercel Hobby is for personal, non-commercial use. A live shop belongs on Pro.
