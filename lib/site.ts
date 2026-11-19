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
// ALLOW_INDEXING decides when it is set ("true" or anything else). When it is missing, Vercel's own VERCEL_ENV decides,
// so a production redeploy that lost the variable is still indexable instead of silently telling Google to drop the
// whole site. Local builds have no VERCEL_ENV and stay out of the index.
const ALLOW_INDEXING = process.env.ALLOW_INDEXING?.trim();
export const INDEXING_ALLOWED = ALLOW_INDEXING ? ALLOW_INDEXING === "true" : process.env.VERCEL_ENV === "production";

// The brand's own profiles elsewhere (Instagram, Facebook, Pinterest, Etsy shop, X…), from BRAND_SAME_AS: comma-separated
// absolute URLs set by the owner. Only http(s) URLs are kept; nothing is listed until the owner provides them.
// Used for Organization.sameAs (lib/jsonld) and the X card's site handle (lib/seo).
export function brandProfiles(): string[] {
  return String(process.env.BRAND_SAME_AS || "")
    .split(",")
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\/\S+$/.test(u));
}

// "@handle" of the brand's X (Twitter) account when BRAND_SAME_AS lists one, otherwise undefined.
export function xHandle(): string | undefined {
  for (const profile of brandProfiles()) {
    const match = profile.match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/i);
    if (match) return `@${match[1]}`;
  }
  return undefined;
}
