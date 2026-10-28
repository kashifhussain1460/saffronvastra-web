import type { MetadataRoute } from "next";
import { INDEXING_ALLOWED, SITE_URL } from "@/lib/site";

const PRIVATE = ["/admin", "/account", "/auth", "/checkout", "/cart", "/order-confirmation", "/wishlist", "/newsletter/unsubscribe", "/api/"];

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING_ALLOWED) {
    // Development, staging and previews: keep everything out of search engines.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
