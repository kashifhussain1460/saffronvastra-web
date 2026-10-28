import { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";

/**
 * A listed product plus the raw catalogue attributes the shop filters need.
 * The mapped Product fills gaps with defaults (e.g. "Velvet" when no material is stored), so the
 * filters read the raw API fields instead and never offer a value the catalogue does not hold.
 */
export interface ShopProduct extends Product {
  /** Material names as stored, split on commas ("Cotton, Velvet" -> ["Cotton", "Velvet"]). */
  materials: string[];
  embroidery: string | null;
  /** Variant sizes / colours as stored (only Active variants are returned by the API). */
  variantSizes: string[];
  variantColours: { name: string; hex: string }[];
  /** Collections the product is known to belong to (filled in by the page when it has that data). */
  collectionSlugs: string[];
  categoryName?: string;
  secondImage?: string;
}

export function toShopProduct(raw: any): ShopProduct {
  const p = mapBackendProductToFrontend(raw);
  const variants: any[] = Array.isArray(raw?.variants) ? raw.variants : [];
  const sizes = Array.from(new Set(variants.map((v) => v?.size).filter((s): s is string => typeof s === "string" && !!s)));
  const colourMap = new Map<string, string>();
  for (const v of variants) {
    if (v?.colourName && !colourMap.has(v.colourName)) colourMap.set(v.colourName, v.colourHex || "");
  }
  const materials =
    typeof raw?.material === "string"
      ? Array.from(new Set(raw.material.split(",").map((m: string) => m.trim()).filter(Boolean))) as string[]
      : [];
  return {
    ...p,
    materials,
    embroidery: typeof raw?.embroidery === "string" && raw.embroidery.trim() ? raw.embroidery.trim() : null,
    variantSizes: sizes,
    variantColours: Array.from(colourMap, ([name, hex]) => ({ name, hex })),
    collectionSlugs: Array.isArray(raw?.collections)
      ? raw.collections.map((c: any) => c?.collection?.slug).filter(Boolean)
      : [],
    categoryName: raw?.category?.name || undefined,
    secondImage: p.images.length > 1 ? p.images[1] : undefined,
  };
}

// ---------------------------------------------------------------------------
// Filter + sort state (mirrors the URL query string)
// ---------------------------------------------------------------------------

export type SortKey = "featured" | "title-asc" | "title-desc" | "price-asc" | "price-desc" | "date-asc" | "date-desc";
export type ViewMode = "list" | "2" | "3" | "4";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "title-asc", label: "Alphabetically, A-Z" },
  { value: "title-desc", label: "Alphabetically, Z-A" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "date-asc", label: "Date, old to new" },
  { value: "date-desc", label: "Date, new to old" },
];

// Old links (PDP breadcrumbs, bookmarks) used these sort names.
const LEGACY_SORT: Record<string, SortKey> = {
  "low-to-high": "price-asc",
  "high-to-low": "price-desc",
  newest: "date-desc",
  name: "title-asc",
};

export interface ShopFilters {
  category: string[];
  collection: string[];
  availability: string[];
  size: string[];
  colour: string[];
  material: string[];
  embroidery: string[];
  sale: boolean;
  min: number | null;
  max: number | null;
}

export type ListFacet = "category" | "collection" | "availability" | "size" | "colour" | "material" | "embroidery";
export const LIST_FACETS: ListFacet[] = ["category", "collection", "availability", "size", "colour", "material", "embroidery"];

export const FACET_TITLES: Record<ListFacet, string> = {
  category: "Category",
  collection: "Collection",
  availability: "Availability",
  size: "Size",
  colour: "Colour",
  material: "Material",
  embroidery: "Embroidery",
};

export interface ShopQuery {
  filters: ShopFilters;
  sort: SortKey;
  page: number;
  view: ViewMode | null;
}

const list = (v: string | null) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
const num = (v: string | null) => {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

export function parseShopQuery(sp: URLSearchParams | { get(name: string): string | null }): ShopQuery {
  const rawSort = sp.get("sort") || "featured";
  const sort = (SORT_OPTIONS.some((o) => o.value === rawSort) ? rawSort : LEGACY_SORT[rawSort] || "featured") as SortKey;
  const view = sp.get("view");
  const page = Number(sp.get("page"));
  return {
    filters: {
      category: list(sp.get("category")),
      collection: list(sp.get("collection")),
      availability: list(sp.get("availability")),
      size: list(sp.get("size")),
      colour: list(sp.get("colour")),
      material: list(sp.get("material")),
      embroidery: list(sp.get("embroidery")),
      sale: sp.get("sale") === "1",
      min: num(sp.get("min")),
      max: num(sp.get("max")),
    },
    sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    view: view === "list" || view === "2" || view === "3" || view === "4" ? view : null,
  };
}

/** Builds the query string, keeping unrelated params (e.g. the search term "q"). */
export function buildShopSearch(base: URLSearchParams, q: ShopQuery): string {
  const sp = new URLSearchParams(base.toString());
  const KEYS = [...LIST_FACETS, "sale", "min", "max", "sort", "page", "view"];
  KEYS.forEach((k) => sp.delete(k));
  for (const f of LIST_FACETS) if (q.filters[f].length) sp.set(f, q.filters[f].join(","));
  if (q.filters.sale) sp.set("sale", "1");
  if (q.filters.min !== null) sp.set("min", String(q.filters.min));
  if (q.filters.max !== null) sp.set("max", String(q.filters.max));
  if (q.sort !== "featured") sp.set("sort", q.sort);
  if (q.page > 1) sp.set("page", String(q.page));
  if (q.view) sp.set("view", q.view);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const EMPTY_FILTERS: ShopFilters = {
  category: [],
  collection: [],
  availability: [],
  size: [],
  colour: [],
  material: [],
  embroidery: [],
  sale: false,
  min: null,
  max: null,
};

export function countActiveFilters(f: ShopFilters): number {
  return LIST_FACETS.reduce((n, k) => n + f[k].length, 0) + (f.sale ? 1 : 0) + (f.min !== null || f.max !== null ? 1 : 0);
}

function facetValues(p: ShopProduct, facet: ListFacet): string[] {
  switch (facet) {
    case "category":
      return [p.category];
    case "collection":
      return p.collectionSlugs;
    case "availability":
      return [p.availabilityMode];
    case "size":
      return p.variantSizes;
    case "colour":
      return p.variantColours.map((c) => c.name);
    case "material":
      return p.materials;
    case "embroidery":
      return p.embroidery ? [p.embroidery] : [];
  }
}

export const isOnSale = (p: Product) => !!p.compareAtPrice && p.compareAtPrice > p.price;

function matches(p: ShopProduct, f: ShopFilters, skip?: ListFacet): boolean {
  for (const facet of LIST_FACETS) {
    if (facet === skip || f[facet].length === 0) continue;
    const vals = facetValues(p, facet);
    // "new-arrivals" is an old category link; it means the New Arrival flag.
    if (facet === "category" && f.category.includes("new-arrivals") && p.badges?.includes("NEW")) continue;
    if (!vals.some((v) => f[facet].includes(v))) return false;
  }
  if (f.sale && !isOnSale(p)) return false;
  if (f.min !== null && p.price < f.min) return false;
  if (f.max !== null && p.price > f.max) return false;
  return true;
}

export function applyFilters(products: ShopProduct[], f: ShopFilters): ShopProduct[] {
  return products.filter((p) => matches(p, f));
}

export function sortProducts(products: ShopProduct[], sort: SortKey): ShopProduct[] {
  if (sort === "featured") return products; // catalogue order as the API returns it
  const out = [...products];
  const date = (p: ShopProduct) => (p.createdAt ? Date.parse(p.createdAt) || 0 : 0);
  out.sort((a, b) => {
    switch (sort) {
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "date-asc":
        return date(a) - date(b);
      case "date-desc":
        return date(b) - date(a);
      default:
        return 0;
    }
  });
  return out;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  hex?: string;
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "Free Size"];

/**
 * Options for every facet, built only from values the loaded products really have.
 * Counts are "faceted": each facet's counts apply every other active filter.
 */
export function buildFacetOptions(
  products: ShopProduct[],
  f: ShopFilters,
  labels: { category?: Record<string, string>; collection?: Record<string, string> } = {}
): Record<ListFacet, FacetOption[]> {
  const out = {} as Record<ListFacet, FacetOption[]>;
  for (const facet of LIST_FACETS) {
    const counts = new Map<string, number>();
    const hexes = new Map<string, string>();
    for (const p of products) {
      const vals = facetValues(p, facet);
      vals.forEach((v) => !counts.has(v) && counts.set(v, 0));
      if (facet === "colour") p.variantColours.forEach((c) => c.hex && !hexes.has(c.name) && hexes.set(c.name, c.hex));
      if (!matches(p, f, facet)) continue;
      new Set(vals).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    }
    let opts: FacetOption[] = Array.from(counts, ([value, count]) => ({
      value,
      count,
      label:
        facet === "category"
          ? labels.category?.[value] || value.replace(/-/g, " ")
          : facet === "collection"
          ? labels.collection?.[value] || value.replace(/-/g, " ")
          : value,
      hex: hexes.get(value),
    }));
    // Category/collection lists only show entries the storefront publishes (when the page knows them).
    if (facet === "category" && labels.category) opts = opts.filter((o) => labels.category![o.value] || f.category.includes(o.value));
    if (facet === "collection" && labels.collection) opts = opts.filter((o) => labels.collection![o.value]);
    const rank = (v: string) => (SIZE_ORDER.indexOf(v) === -1 ? 999 : SIZE_ORDER.indexOf(v));
    if (facet === "size") opts.sort((a, b) => rank(a.value) - rank(b.value) || a.value.localeCompare(b.value));
    else if (facet !== "category" && facet !== "collection") opts.sort((a, b) => a.label.localeCompare(b.label));
    out[facet] = opts;
  }
  return out;
}

export function priceBounds(products: ShopProduct[]) {
  const top = products.reduce((m, p) => Math.max(m, p.price), 0);
  // The slider covers the whole catalogue so the dearest piece is never hidden by a fixed cap.
  return { floor: 0, ceiling: Math.max(20000, Math.ceil(top / 1000) * 1000) };
}

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
