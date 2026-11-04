import { cache } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { collectionsHeading, ShopCategory } from "@/components/shop/ShopPageTitle";
import type { InitialShopPage } from "@/components/shop/ShopView";
import { LIST_FACETS, parseShopQuery, priceBounds, ShopQuery, toShopProduct } from "@/components/shop/shopData";
import { breadcrumbList } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { API_ORIGIN, INDEXING_ALLOWED } from "@/lib/site";
import CollectionsClient from "./CollectionsClient";

// The listing comes from the live catalogue on every request.
export const dynamic = "force-dynamic";

const COLLECTIONS_PATH = "/collections";
const COLLECTIONS_TITLE = "Shop the Collection";
const COLLECTIONS_DESCRIPTION =
  "Hand-embroidered velvet and cotton jackets, made to order by artisans in Jaipur. Browse every piece and filter by category, size and price.";

// Products per page: the server asks the API for exactly the page the listing shows (ShopView's page size).
const PER_PAGE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

interface CollectionsPageProps {
  searchParams: Promise<SearchParams>;
}

function toSearchParams(sp: SearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => out.append(key, v));
    else if (value !== undefined) out.append(key, value);
  }
  return out;
}

// Published categories (one call per request, shared by the metadata and the page). null when the API fails.
const loadCategories = cache(async (): Promise<ShopCategory[] | null> => {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/categories`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    if (!Array.isArray(body?.data)) return null;
    return body.data.map((c: any) => ({
      id: String(c.id),
      name: String(c.name),
      slug: String(c.slug),
      parentId: c.parentId ?? null,
      shortDescription: c.shortDescription ?? null,
    }));
  } catch {
    return null;
  }
});

// One page of the listing from the API's own category filter (a parent category includes its sub-categories)
// and page, in the API's default order, which is the order the browser lists them in. null when the API fails.
const loadListingPage = cache(async (categorySlug: string | null, page: number) => {
  try {
    const qs = new URLSearchParams({ limit: String(PER_PAGE), page: String(page) });
    if (categorySlug) qs.set("category", categorySlug);
    const res = await fetch(`${API_ORIGIN}/api/v1/products?${qs}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    return { items: (body.items || []) as any[], total: Number(body.pagination?.total) || 0 };
  } catch {
    return null;
  }
});

// The dearest published product (the API's price-desc order uses the same base price the listing shows), so the
// price slider rendered with the server's page already spans the whole catalogue. null when the API fails.
const loadDearestProduct = cache(async () => {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/products?sort=price-desc&limit=1`, { cache: "no-store" });
    if (!res.ok) return null;
    const first = (await res.json())?.items?.[0];
    return first ? toShopProduct(first) : null;
  } catch {
    return null;
  }
});

// Sort, price, size and the other facets change what is listed, so such views are not landing pages.
const isRefined = (q: ShopQuery) =>
  q.sort !== "featured" ||
  q.filters.sale ||
  q.filters.min !== null ||
  q.filters.max !== null ||
  LIST_FACETS.some((f) => f !== "category" && q.filters[f].length > 0);

// Everything the metadata and the page need for one URL.
async function resolveListing(searchParams: Promise<SearchParams>) {
  const query = parseShopQuery(toSearchParams(await searchParams));
  const categories = await loadCategories();
  const heading = collectionsHeading(categories, query.filters.category);
  const selected = query.filters.category;
  const unknownCategory = categories !== null && selected.some((slug) => !categories.some((c) => c.slug === slug));
  const refined = isRefined(query);
  const categorySlug = heading.category?.slug ?? null;
  const basePath = categorySlug ? `${COLLECTIONS_PATH}?category=${encodeURIComponent(categorySlug)}` : COLLECTIONS_PATH;

  // The server renders the views the API lists in the browser's order: the whole catalogue or one known category.
  let initialPage: InitialShopPage | undefined;
  let pageExists: boolean | null = query.page === 1 ? true : null; // null: unknown (API failure or not checked)
  if (!refined && (selected.length === 0 || heading.category)) {
    const [data, dearest] = await Promise.all([loadListingPage(categorySlug, query.page), loadDearestProduct()]);
    if (data) {
      const totalPages = Math.max(1, Math.ceil(data.total / PER_PAGE));
      pageExists = query.page <= totalPages;
      if (pageExists && data.items.length > 0) {
        initialPage = {
          query,
          items: data.items.map(toShopProduct),
          totalPages,
          total: data.total,
          ...(dearest ? { priceCeiling: priceBounds([dearest]).ceiling } : {}),
        };
      }
    }
  }

  return { query, categories, heading, unknownCategory, refined, basePath, pageExists, initialPage };
}

export async function generateMetadata({ searchParams }: CollectionsPageProps): Promise<Metadata> {
  const { query, heading, unknownCategory, refined, basePath, pageExists } = await resolveListing(searchParams);
  const notListed = { index: false, follow: INDEXING_ALLOWED };

  // An unknown category, or a page past the last one, is not a page of its own.
  if (unknownCategory || (!refined && pageExists === false)) {
    return {
      ...buildMetadata({ title: COLLECTIONS_TITLE, description: COLLECTIONS_DESCRIPTION, path: COLLECTIONS_PATH }),
      robots: notListed,
    };
  }

  // A category's stored short description is its meta description; the catalogue text is the fallback.
  const title = heading.category?.name ?? COLLECTIONS_TITLE;
  const description = heading.category?.shortDescription?.trim() || COLLECTIONS_DESCRIPTION;
  // Page N of an unrefined view is canonical to itself; sort, price, size and other filters fold into the bare view.
  const path =
    !refined && query.page > 1 && pageExists ? `${basePath}${basePath.includes("?") ? "&" : "?"}page=${query.page}` : basePath;
  return buildMetadata({ title, description, path });
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const { categories, heading, initialPage } = await resolveListing(searchParams);
  return (
    <>
      <CollectionsClient categories={categories} initialPage={initialPage} perPage={PER_PAGE} />
      {/* same trail as the visible breadcrumb */}
      <JsonLd data={breadcrumbList(heading.crumbs.map((c) => ({ name: c.label, path: c.href })))} />
    </>
  );
}
