import type { MetadataRoute } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { API_ORIGIN, SITE_URL } from "@/lib/site";

// Rebuilt at most every hour so new and unpublished products show up without a deploy.
// At run time any failed API call throws, so Next keeps serving the last good sitemap instead of caching a short one.
// During `next build` a failure must not fail the deploy (the API may be unreachable from the build machine), so the
// build falls back to the static pages only; the first revalidation after deploy then replaces it with the full list.
export const revalidate = 3600;

// next build sets NEXT_PHASE before it starts the workers that prerender this route.
const isBuildPhase = () => process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

async function getJson(path: string): Promise<any> {
  // A hanging API must not hold the build past Next's page generation timeout (60 s), so build-time calls give up early.
  const res = await fetch(`${API_ORIGIN}/api/v1${path}`, { next: { revalidate }, ...(isBuildPhase() ? { signal: AbortSignal.timeout(15000) } : {}) });
  if (!res.ok) throw new Error(`Sitemap: ${path} responded with ${res.status}`);
  return res.json();
}

// Every page of a paged list (the API returns at most 50 items per page).
async function allPages(path: string): Promise<any[]> {
  const items: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const body = await getJson(`${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=50`);
    const pageItems: any[] = body?.items || [];
    items.push(...pageItems);
    if (!pageItems.length || page >= (body.pagination?.totalPages || 1)) break;
  }
  // A product can move between pages while they are read; list each URL once.
  return items.filter((item, i) => items.findIndex((other) => other.slug === item.slug) === i);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each loc is exactly the canonical URL the page renders (the home canonical has no trailing slash).
  const url = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);
  const statics: MetadataRoute.Sitemap = [
    "/",
    "/collections",
    "/about",
    "/contact",
    "/faqs",
    "/size-guide",
    "/payment-methods",
    "/order-cancellation",
    "/policies/shipping",
    "/policies/returns",
    "/policies/privacy",
    "/policies/terms",
  ].map((path) => ({ url: url(path), changeFrequency: path === "/" ? "daily" : "monthly", priority: path === "/" ? 1 : 0.5 }));

  try {
    return [...statics, ...(await catalogueEntries(url))];
  } catch (error) {
    if (!isBuildPhase()) throw error;
    console.warn(`Sitemap: the API was not usable during the build (${error instanceof Error ? error.message : error}), so it was built with the static pages only. It is regenerated from the API at most ${revalidate} s after deploy.`);
    return statics;
  }
}

// Categories, collections, products and journal stories from the public API. Throws when any call fails or comes back empty.
async function catalogueEntries(url: (path: string) => string): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections, journal] = await Promise.all([
    allPages("/products"),
    getJson("/categories"),
    getJson("/collections"),
    allPages("/journal"),
  ]);
  const categoryList: any[] = categories?.data || [];

  // The catalogue is never empty in a working shop, so an empty answer is treated as a failure too.
  if (!products.length) throw new Error("Sitemap: the products API returned no products");
  if (!categoryList.length) throw new Error("Sitemap: the categories API returned no categories");

  // Only what the public API returns: Active, not deleted, published.
  const productEntries = products.map((p) => ({ url: url(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 }));
  const categoryEntries = categoryList.map((c) => ({ url: url(`/collections?category=${encodeURIComponent(c.slug)}`), changeFrequency: "weekly" as const, priority: 0.7 }));
  const collectionEntries = (collections?.data || []).map((c: any) => ({ url: url(`/collections/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 }));

  // The journal is listed only once it has published stories.
  const journalEntries: MetadataRoute.Sitemap = journal.length
    ? [
        { url: url("/journal"), changeFrequency: "weekly" as const, priority: 0.5 },
        ...journal.map((a) => ({ url: url(`/journal/${a.slug}`), lastModified: a.publishedAt || undefined, changeFrequency: "monthly" as const, priority: 0.6 })),
      ]
    : [];

  return [...categoryEntries, ...collectionEntries, ...productEntries, ...journalEntries];
}
