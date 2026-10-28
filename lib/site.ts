// Public origin of the storefront (canonical URLs, sitemap, structured data). Set SITE_URL in each environment.
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Server-side address of the API (same value the pages already use).
export const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:4000";

// Only a production deployment may be indexed; staging and previews must not appear in search results.
export const INDEXING_ALLOWED = process.env.ALLOW_INDEXING === "true";
