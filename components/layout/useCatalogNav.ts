"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";

export interface NavCategory {
  name: string;
  slug: string;
  count?: number;
}
export interface NavCollection {
  title: string;
  slug: string;
}
export interface CatalogNav {
  categories: NavCategory[];
  collections: NavCollection[];
}

// One request per page load, shared by the header mega menu, the mobile menu and the footer.
let navPromise: Promise<CatalogNav> | null = null;

function loadNav(): Promise<CatalogNav> {
  if (!navPromise) {
    const json = (url: string) =>
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
    navPromise = Promise.all([json("/api/v1/categories"), json("/api/v1/collections")]).then(([cats, cols]) => ({
      categories: Array.isArray(cats?.data)
        ? cats.data
            .filter((c: { parentId?: string | null; status?: string }) => !c.parentId && (!c.status || c.status === "Active"))
            .map((c: { name: string; slug: string; productsCount?: number }) => ({ name: c.name, slug: c.slug, count: c.productsCount }))
        : [],
      collections: Array.isArray(cols?.data)
        ? cols.data
            .filter((c: { status?: string }) => !c.status || c.status === "Active")
            .map((c: { title: string; slug: string }) => ({ title: c.title, slug: c.slug }))
        : [],
    }));
    // a failed load may be retried on the next mount
    navPromise.then((r) => {
      if (r.categories.length === 0 && r.collections.length === 0) navPromise = null;
    });
  }
  return navPromise;
}

/** Real categories and collections from the API (empty lists until loaded or if the API is down). */
export function useCatalogNav(enabled = true): CatalogNav {
  const [nav, setNav] = useState<CatalogNav>({ categories: [], collections: [] });
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

/** A few featured products from the live catalogue (mega menu and search suggestions). */
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
