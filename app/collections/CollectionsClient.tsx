"use client";

import React, { useEffect, useMemo, useState } from "react";
import ShopPageTitle, { collectionsHeading, ShopCategory } from "@/components/shop/ShopPageTitle";
import ShopView, { InitialShopPage } from "@/components/shop/ShopView";
import { useShopQuery } from "@/components/shop/hooks";
import { ShopProduct, toShopProduct } from "@/components/shop/shopData";
import { useCatalogNav } from "@/components/layout/useCatalogNav";

export interface CollectionsClientProps {
  /** Published categories from the server, for the category landing heading. */
  categories?: ShopCategory[] | null;
  /** The page of products the server rendered for this URL, shown until the full catalogue has loaded. */
  initialPage?: InitialShopPage;
  perPage?: number;
}

/**
 * The full catalogue (Modave "shop-left-sidebar"). Every published product is loaded once and the
 * filters / sort / pagination run in the browser, so each facet only offers values the products have.
 * Collection membership is not part of the product list response, so it is read from each published
 * collection's own endpoint.
 */
function CollectionsContent({ categories, initialPage, perPage }: CollectionsClientProps) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [collectionLabels, setCollectionLabels] = useState<Record<string, string> | undefined>(undefined);
  const [membership, setMembership] = useState<Record<string, string[]>>({});
  const { query } = useShopQuery();
  // The category and collection lists come from the catalogue loader the header, footer and mobile menu already
  // share (one request each per page view). The lists stay empty while loading or if the API failed, and the
  // labels then stay undefined, exactly as when this page fetched them itself.
  const { allFlatCategories, collections } = useCatalogNav();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState("loading");
      try {
        const getPage = async (page: number) => {
          const res = await fetch(`/api/v1/products?limit=50&page=${page}`, { credentials: "include" });
          if (!res.ok) throw new Error("products");
          return res.json();
        };
        // Page 1 gives the page count; the remaining pages (at most 20 in all) are requested together and kept
        // in page order, so the list is the same as reading them one after another.
        const first = await getPage(1);
        const pageCount = first.pagination?.hasMore ? Math.min(Number(first.pagination?.totalPages) || 1, 20) : 1;
        const rest = await Promise.all(Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => getPage(i + 2)));
        const all: ShopProduct[] = [first, ...rest].flatMap((body) => (body.items || []).map(toShopProduct));
        if (!cancelled) {
          setProducts(all);
          setLoadState("ready");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const categoryLabels = useMemo(
    () => (allFlatCategories.length ? Object.fromEntries(allFlatCategories.map((c) => [c.slug, String(c.name)])) : undefined),
    [allFlatCategories]
  );

  useEffect(() => {
    if (!collections.length) return;
    let cancelled = false;
    (async () => {
      const cols = collections.slice(0, 24);
      const members: Record<string, string[]> = {};
      await Promise.all(
        cols.map(async (c) => {
          const r = await fetch(`/api/v1/collections/${encodeURIComponent(c.slug)}`, { credentials: "include" }).catch(() => null);
          if (!r || !r.ok) return;
          const body = await r.json().catch(() => null);
          for (const p of body?.data?.products ?? []) {
            if (!p?.id) continue;
            (members[p.id] ||= []).push(c.slug);
          }
        })
      );
      if (cancelled) return;
      setMembership(members);
      setCollectionLabels(Object.fromEntries(cols.map((c) => [c.slug, c.title])));
    })();
    return () => {
      cancelled = true;
    };
  }, [collections, reloadKey]);

  const listed = useMemo(
    () => products.map((p) => (membership[p.id] ? { ...p, collectionSlugs: membership[p.id] } : p)),
    [products, membership]
  );
  const labels = useMemo(() => ({ category: categoryLabels, collection: collectionLabels }), [categoryLabels, collectionLabels]);
  // Follows the URL, so choosing another category in the filters updates the heading too.
  const heading = useMemo(() => collectionsHeading(categories, query.filters.category), [categories, query.filters.category]);

  return (
    <div className="min-h-screen bg-canvas">
      <ShopPageTitle
        title={heading.title}
        subtitle={heading.subtitle}
        crumbs={heading.crumbs}
        image="/images/hero/collections_hero.jpg"
      />
      <ShopView
        products={listed}
        loadState={loadState}
        onRetry={() => setReloadKey((k) => k + 1)}
        labels={labels}
        errorText="We could not load the collection right now."
        initialPage={initialPage}
        perPage={perPage}
      />
    </div>
  );
}

// No Suspense boundary here: /collections is rendered per request (force-dynamic), so useSearchParams does not
// suspend, and a boundary only made React stream the server-rendered listing into a hidden <div> that a script then
// swaps in. Without it the heading, products and pagination sit directly inside <main> in the HTML.
export default function CollectionsClient(props: CollectionsClientProps) {
  return <CollectionsContent {...props} />;
}
