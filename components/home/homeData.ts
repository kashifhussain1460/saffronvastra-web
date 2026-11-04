// Home page data shared by the server (app/page.tsx renders the shelves and collection cards into the HTML) and by
// HomeCatalogue / DynamicCollections in the browser (used only when the server could not reach the API).
// Pure functions only, so both sides build exactly the same shelves from the same API responses.
import { Product } from "@/types";
import type { NavSubcategory } from "@/components/layout/useCatalogNav";

export const SHELF_SIZE = 8;

// The four product queries behind the home shelves, in the order buildHomeCatalogue expects them.
export const HOME_PRODUCT_QUERIES = [
  `/api/v1/products?bestseller=true&limit=${SHELF_SIZE}`,
  `/api/v1/products?newArrival=true&limit=${SHELF_SIZE}`,
  `/api/v1/products?sort=featured&limit=${SHELF_SIZE}`,
  `/api/v1/products?sort=newest&limit=48`,
] as const;

// Products saved without photos get the brand logo as their image; rows and the gallery prefer pieces with photos.
const PLACEHOLDER_IMAGE = "/images/brand/";
const hasPhoto = (p: Product) => Boolean(p.images[0]) && !p.images[0].startsWith(PLACEHOLDER_IMAGE);
const photosFirst = (list: Product[]) => [...list.filter(hasPhoto), ...list.filter((p) => !hasPhoto(p))];

export interface Shelf {
  title: string;
  subtitle: string;
  products: Product[];
}

export interface HomeCatalogueData {
  first: Shelf | null;
  second: Shelf | null;
  look: Product[];
}

// Featured Suzani products row, second product row and the "shop the look" gallery.
export function buildHomeCatalogue(
  bestsellers: Product[],
  newArrivals: Product[],
  featuredRaw: Product[],
  latest: Product[]
): HomeCatalogueData {
  const allSorted = photosFirst(latest);

  // First shelf: curated collection pieces
  const firstProducts = bestsellers.length > 0 ? bestsellers : allSorted.slice(0, SHELF_SIZE);
  const first: Shelf | null =
    firstProducts.length > 0
      ? {
          title: "Discover Our Suzani Collection",
          subtitle:
            "Explore distinctive pieces crafted to bring traditional embroidery into contemporary wardrobes.",
          products: firstProducts,
        }
      : null;

  // Remaining inventory after allocating to the first shelf
  const firstIds = new Set((firstProducts || []).map((p) => p.id));
  const remaining = allSorted.filter((p) => !firstIds.has(p.id));

  // Second shelf: new arrivals, featured, or next tranche of pieces
  let secondProducts: Product[] = [];
  let secondTitle = "Featured Suzani Pieces";
  let secondSubtitle = "Handcrafted selections from our Jaipur workshop.";

  if (newArrivals.length > 0) {
    secondProducts = newArrivals;
    secondTitle = "New Suzani Arrivals";
    secondSubtitle = "Freshly tailored additions to our collection.";
  } else if (featuredRaw.length > 0) {
    secondProducts = featuredRaw.filter((p) => !firstIds.has(p.id)).slice(0, SHELF_SIZE);
  }

  if (secondProducts.length === 0 && remaining.length > 0) {
    secondProducts = remaining.slice(0, SHELF_SIZE);
  }

  const second: Shelf | null =
    secondProducts.length > 0
      ? {
          title: secondTitle,
          subtitle: secondSubtitle,
          products: secondProducts,
        }
      : null;

  // "Shop the Look" editorial gallery
  const shownIds = new Set([
    ...(first?.products ?? []).map((p) => p.id),
    ...(second?.products ?? []).map((p) => p.id),
  ]);
  const lookCandidates = [...allSorted.filter((p) => !shownIds.has(p.id)), ...allSorted];
  const seenLook = new Set<string>();
  const look = lookCandidates
    .filter((p) => {
      if (seenLook.has(p.id) || !hasPhoto(p)) return false;
      seenLook.add(p.id);
      return true;
    })
    .slice(0, 10);

  return { first, second, look };
}

// The category fields the collection cards read (image and product count).
export type CollectionCategory = Pick<NavSubcategory, "id" | "name" | "slug" | "count" | "image">;

// The same active-category list useCatalogNav builds (allFlatCategories) from GET /api/v1/categories.
export function toCollectionCategories(rawCats: any[]): CollectionCategory[] {
  return rawCats
    .filter((c) => !c.status || c.status === "Active")
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.productsCount ?? 0,
      image: c.image || null,
    }));
}
