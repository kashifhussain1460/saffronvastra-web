// Public origin of the storefront (canonical URLs, sitemap, structured data). Set SITE_URL in each environment.
// The live shop is served from www (Vercel redirects the bare domain to it), so a SITE_URL that names the bare domain
// is moved to www here. Otherwise every canonical, sitemap entry and structured-data URL would point at a redirect.
const BARE_DOMAIN = "saffronvastra.com";

function canonicalOrigin(raw: string): string {
  const origin = raw.replace(/\/$/, "");
  try {
    const url = new URL(origin);
    if (url.hostname === BARE_DOMAIN) {
      url.hostname = `www.${BARE_DOMAIN}`;
      url.protocol = "https:";
      return url.origin;
    }
  } catch {
    // not a URL: keep the value as given
  }
  return origin;
}

export const SITE_URL = canonicalOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

// Server-side address of the API (same value the pages already use).
export const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:4000";

// Only a production deployment may be indexed; staging and previews must not appear in search results.
export const INDEXING_ALLOWED = process.env.ALLOW_INDEXING === "true";
