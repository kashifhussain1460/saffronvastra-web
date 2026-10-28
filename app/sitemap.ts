import type { MetadataRoute } from "next";
import { API_ORIGIN, SITE_URL } from "@/lib/site";

// Rebuilt at most every hour so new and unpublished products show up without a deploy.
export const revalidate = 3600;

async function getJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1${path}`, { next: { revalidate } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function allPages(path: string, limit: number): Promise<any[]> {
  const items: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const body = await getJson(`${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=${limit}`);
    if (!body?.items?.length) break;
    items.push(...body.items);
    if (page >= (body.pagination?.totalPages || 1)) break;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${SITE_URL}${path}`;
  const statics: MetadataRoute.Sitemap = ["/", "/collections", "/journal", "/about", "/contact", "/faqs", "/size-guide", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"].map(
    (path) => ({ url: url(path), changeFrequency: path === "/" ? "daily" : "monthly", priority: path === "/" ? 1 : 0.5 })
  );

  const [products, journal, categories, collections] = await Promise.all([
    allPages("/products", 100),
    allPages("/journal", 50),
    getJson("/categories"),
    getJson("/collections"),
  ]);

  // Only what the public API returns: Active, not deleted, published.
  const productEntries = products.map((p) => ({ url: url(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 }));
  const categoryEntries = (categories?.data || []).map((c: any) => ({ url: url(`/collections?category=${encodeURIComponent(c.slug)}`), changeFrequency: "weekly" as const, priority: 0.7 }));
  const collectionEntries = (collections?.data || []).map((c: any) => ({ url: url(`/collections/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 }));
  const journalEntries = journal.map((a) => ({ url: url(`/journal/${a.slug}`), lastModified: a.publishedAt || a.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 }));

  return [...statics, ...categoryEntries, ...collectionEntries, ...productEntries, ...journalEntries];
}
