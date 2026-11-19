import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import { collectionsHeading, ShopCategory } from "@/components/shop/ShopPageTitle";
import type { InitialShopPage } from "@/components/shop/ShopView";
import { LIST_FACETS, parseShopQuery, priceBounds, ShopQuery, toShopProduct } from "@/components/shop/shopData";
import { catalogueRoot, categoryPageTitle } from "@/lib/catalogue";
import { breadcrumbList } from "@/lib/jsonld";
import { buildMetadata, notFoundMetadata, truncateAtWord } from "@/lib/seo";
import { API_ORIGIN } from "@/lib/site";
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
    const res = await fetch(`${API_ORIGIN}/api/v1/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const body = await res.json();
    if (!Array.isArray(body?.data)) return null;
    return body.data.map((c: any) => ({
      id: String(c.id),
      name: String(c.name),
      slug: String(c.slug),
      parentId: c.parentId ?? null,
      shortDescription: c.shortDescription ?? null,
      detailedDescription: c.detailedDescription ?? null,
      image: c.image ?? null,
      bannerImage: c.bannerImage ?? null,
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
    const res = await fetch(`${API_ORIGIN}/api/v1/products?${qs}`, { next: { revalidate: 60 } });
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
    const res = await fetch(`${API_ORIGIN}/api/v1/products?sort=price-desc&limit=1`, { next: { revalidate: 300 } });
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
  // The top-level category that holds every product lists the same pieces as /collections, so /collections is its
  // canonical page (see lib/catalogue) and carries its introduction.
  const root = catalogueRoot(categories);
  const isCatalogueView = !heading.category || heading.category.id === root?.id;
  const basePath = isCatalogueView ? COLLECTIONS_PATH : `${COLLECTIONS_PATH}?category=${encodeURIComponent(categorySlug!)}`;

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

  // An unknown category, or a page past the last one, does not exist: a real 404 (not a 200 page with noindex).
  const missing = unknownCategory || (!refined && pageExists === false);

  return { query, categories, heading, refined, basePath, pageExists, initialPage, root, isCatalogueView, missing };
}

export async function generateMetadata({ searchParams }: CollectionsPageProps): Promise<Metadata> {
  const { query, heading, refined, basePath, pageExists, missing } = await resolveListing(searchParams);

  // The same title as the 404 page itself and no canonical, as for a missing product (see notFoundMetadata).
  if (missing) return notFoundMetadata();

  // A category's stored short description is its meta description; the catalogue text is the fallback.
  const category = heading.category;
  let title = category ? categoryPageTitle(category.name) : COLLECTIONS_TITLE;
  let description = category?.shortDescription?.trim() || COLLECTIONS_DESCRIPTION;
  // Page N of an unrefined view is canonical to itself; sort, price, size and other filters fold into the bare view.
  const paged = !refined && query.page > 1 && pageExists;
  const path = paged ? `${basePath}${basePath.includes("?") ? "&" : "?"}page=${query.page}` : basePath;
  // Later pages get their own title and description, so search results never show several identical entries.
  if (paged) {
    title = `${title} – Page ${query.page}`;
    description = truncateAtWord(`Page ${query.page} of ${category ? category.name : "the collection"}. ${description}`, 155);
  }
  // The category's own picture when the owner has set one; otherwise buildMetadata adds the default share image.
  const picture = category?.bannerImage || category?.image;
  return buildMetadata({ title, description, path, ...(picture ? { images: [{ url: picture, alt: category!.name }] } : {}) });
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const { query, categories, heading, initialPage, refined, root, isCatalogueView, missing } = await resolveListing(searchParams);
  if (missing) notFound();
  // The introduction, on the landing view only (page 1, no sort or filters), so the text is not repeated across
  // paginated or filtered views: the category's own, or on /collections the one of the category that holds the whole
  // catalogue. Plain text; blank lines separate paragraphs.
  const introCategory = heading.category ?? (isCatalogueView ? root : undefined);
  const intro = !refined && query.page === 1 ? introCategory?.detailedDescription?.trim() : "";
  const paragraphs = intro ? intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
  return (
    <>
      <CollectionsClient categories={categories} initialPage={initialPage} perPage={PER_PAGE} />
      {paragraphs.length > 0 && introCategory && (
        <section aria-labelledby="category-intro" className="bg-canvas">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl py-10 md:py-14 border-t border-line">
            <h2 id="category-intro" className="text-xl md:text-2xl font-medium text-ink mb-4">
              About our {introCategory.name}
            </h2>
            <div className="space-y-4 text-base leading-7 text-ink-secondary">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* same trail as the visible breadcrumb */}
      <JsonLd data={breadcrumbList(heading.crumbs.map((c) => ({ name: c.label, path: c.href })))} />
    </>
  );
}
