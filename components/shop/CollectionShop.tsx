"use client";

import React, { useMemo } from "react";
import ShopView from "./ShopView";
import { toShopProduct } from "./shopData";
import { useCatalogNav } from "@/components/layout/useCatalogNav";

/** Client listing for one collection page: the server passes the collection's products as returned by the API. */
export default function CollectionShop({ rawProducts }: { rawProducts: any[] }) {
  const products = useMemo(() => rawProducts.map(toShopProduct), [rawProducts]);
  // Category names come from the catalogue loader the header, footer and mobile menu already share, so the page
  // does not request /api/v1/categories a second time. Until it has loaded (or if it failed) the labels stay undefined.
  const { allFlatCategories } = useCatalogNav();
  const categoryLabels = useMemo(
    () => (allFlatCategories.length ? Object.fromEntries(allFlatCategories.map((c) => [c.slug, String(c.name)])) : undefined),
    [allFlatCategories]
  );
  const labels = useMemo(() => ({ category: categoryLabels }), [categoryLabels]);

  // No Suspense boundary here: /collections/[slug] is rendered per request (force-dynamic), so useSearchParams does
  // not suspend, and a boundary only made React stream the server-rendered grid into a hidden <div> that a script
  // then swaps in. Without it the filters, products and pagination sit directly in the page HTML.
  return (
    <ShopView
      products={products}
      loadState="ready"
      labels={labels}
      hideFacets={["collection"]}
      emptyCatalogue={
        <p role="status" className="rounded-lg border border-line px-6 py-16 text-center text-base text-ink-secondary">
          No pieces have been added to this collection yet.
        </p>
      }
    />
  );
}
