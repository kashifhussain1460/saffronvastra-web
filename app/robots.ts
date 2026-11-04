import type { MetadataRoute } from "next";
import { INDEXING_ALLOWED, SITE_URL } from "@/lib/site";

// Only paths with nothing for a crawler to read. Cart, checkout, auth, wishlist, order confirmation and the
// newsletter pages stay crawlable on purpose: they send noindex, and a crawler can only see that if it may fetch them.
const PRIVATE = ["/api/", "/admin", "/account", "/health"];

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING_ALLOWED) {
    // Development, staging and previews: keep everything out of search engines.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
