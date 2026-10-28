"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import ShopView from "./ShopView";
import { toShopProduct } from "./shopData";

/** Client listing for one collection page: the server passes the collection's products as returned by the API. */
export default function CollectionShop({ rawProducts }: { rawProducts: any[] }) {
  const products = useMemo(() => rawProducts.map(toShopProduct), [rawProducts]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.data)) setCategoryLabels(Object.fromEntries(d.data.map((c: any) => [c.slug, String(c.name)])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const labels = useMemo(() => ({ category: categoryLabels }), [categoryLabels]);

  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
