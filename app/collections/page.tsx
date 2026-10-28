"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import ShopPageTitle from "@/components/shop/ShopPageTitle";
import ShopView from "@/components/shop/ShopView";
import { ShopProduct, toShopProduct } from "@/components/shop/shopData";

/**
 * The full catalogue (Modave "shop-left-sidebar"). Every published product is loaded once and the
 * filters / sort / pagination run in the browser, so each facet only offers values the products have.
 * Collection membership is not part of the product list response, so it is read from each published
 * collection's own endpoint.
 */
function CollectionsContent() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string> | undefined>(undefined);
  const [collectionLabels, setCollectionLabels] = useState<Record<string, string> | undefined>(undefined);
  const [membership, setMembership] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState("loading");
      try {
        const all: ShopProduct[] = [];
        for (let page = 1; page <= 20; page++) {
          const res = await fetch(`/api/v1/products?limit=50&page=${page}`, { credentials: "include" });
          if (!res.ok) throw new Error("products");
          const body = await res.json();
          all.push(...(body.items || []).map(toShopProduct));
          if (!body.pagination?.hasMore) break;
        }
        if (!cancelled) {
          setProducts(all);
          setLoadState("ready");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();

    fetch("/api/v1/categories", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !Array.isArray(d.data)) return;
        setCategoryLabels(Object.fromEntries(d.data.map((c: any) => [c.slug, String(c.name)])));
      })
      .catch(() => undefined);

    fetch("/api/v1/collections", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (d) => {
        if (cancelled || !d || !Array.isArray(d.data)) return;
        const cols: { slug: string; title: string }[] = d.data.slice(0, 24);
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
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const listed = useMemo(
    () => products.map((p) => (membership[p.id] ? { ...p, collectionSlugs: membership[p.id] } : p)),
    [products, membership]
  );
  const labels = useMemo(() => ({ category: categoryLabels, collection: collectionLabels }), [categoryLabels, collectionLabels]);

  return (
    <div className="min-h-screen bg-canvas">
      <ShopPageTitle
        title="Our Collections"
        crumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]}
        image="/images/hero/collections_hero.jpg"
      />
      <ShopView
        products={listed}
        loadState={loadState}
        onRetry={() => setReloadKey((k) => k + 1)}
        labels={labels}
        errorText="We could not load the collection right now."
      />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <h1 className="text-2xl font-medium text-ink">Loading Collections...</h1>
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
