"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";

export interface NavSubcategory {
  id: string;
  name: string;
  slug: string;
  count?: number;
  image?: string | null;
  shortDescription?: string | null;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  count?: number;
  image?: string | null;
  bannerImage?: string | null;
  shortDescription?: string | null;
  subcategories: NavSubcategory[];
}

export interface NavCollection {
  title: string;
  slug: string;
  bannerImage?: string | null;
}

export interface CatalogNav {
  categories: NavCategory[];
  allFlatCategories: NavSubcategory[];
  collections: NavCollection[];
}

// Single memoized promise per page session, shared by the header mega menu, mobile navigation, and footer.
let navPromise: Promise<CatalogNav> | null = null;

function loadNav(): Promise<CatalogNav> {
  if (!navPromise) {
    const json = (url: string) =>
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);

    navPromise = Promise.all([json("/api/v1/categories"), json("/api/v1/collections")]).then(([cats, cols]) => {
      const rawCats: any[] = Array.isArray(cats?.data) ? cats.data : [];
      const activeCats = rawCats.filter((c) => !c.status || c.status === "Active");

      const mainCats = activeCats.filter((c) => !c.parentId);

      const categories: NavCategory[] = mainCats.map((main) => {
        const children = activeCats.filter((child) => child.parentId === main.id);
        return {
          id: main.id,
          name: main.name,
          slug: main.slug,
          count: main.productsCount ?? 0,
          image: main.image || null,
          bannerImage: main.bannerImage || null,
          shortDescription: main.shortDescription || null,
          subcategories: children.map((ch) => ({
            id: ch.id,
            name: ch.name,
            slug: ch.slug,
            count: ch.productsCount ?? 0,
            image: ch.image || null,
            shortDescription: ch.shortDescription || null,
          })),
        };
      });

      const allFlatCategories: NavSubcategory[] = activeCats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c.productsCount ?? 0,
        image: c.image || null,
        shortDescription: c.shortDescription || null,
      }));

      const collections: NavCollection[] = Array.isArray(cols?.data)
        ? cols.data
            .filter((c: any) => !c.status || c.status === "Active")
            .map((c: any) => ({
              title: c.title,
              slug: c.slug,
              bannerImage: c.bannerImage || null,
            }))
        : [];

      return { categories, allFlatCategories, collections };
    });

    // If load failed with zero items, permit a retry on subsequent mount
    navPromise.then((r) => {
      if (r.categories.length === 0 && r.collections.length === 0) navPromise = null;
    });
  }
  return navPromise;
}

/** Real categories and collections from the API (empty lists until loaded or if the API is down). */
export function useCatalogNav(enabled = true): CatalogNav {
  const [nav, setNav] = useState<CatalogNav>({ categories: [], allFlatCategories: [], collections: [] });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadNav().then((r) => {
      if (!cancelled) setNav(r);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return nav;
}

let featuredPromise: Promise<Product[]> | null = null;

/** Featured products from the live catalogue for mega menu and suggestions. */
export function useFeaturedProducts(enabled: boolean, limit = 4): Product[] {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    if (!featuredPromise) {
      featuredPromise = fetch("/api/v1/products?limit=8&sort=featured")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => (Array.isArray(data?.items) ? data.items.map(mapBackendProductToFrontend) : []))
        .catch(() => []);
      featuredPromise.then((r) => {
        if (r.length === 0) featuredPromise = null;
      });
    }
    featuredPromise.then((r) => {
      if (!cancelled) setItems(r);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return items.slice(0, limit);
}
