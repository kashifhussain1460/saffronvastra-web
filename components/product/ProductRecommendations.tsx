"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { useProductsByIds } from "@/lib/useProductsByIds";
import type { Product } from "@/types";

const RECENT_KEY = "saffron_recently_viewed";
const RECENT_MAX = 12;

/** Records a visit and returns the previously viewed product ids (most recent first, current excluded). */
function useRecentlyViewed(currentId: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    let list: string[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(raw)) list = raw.filter((x): x is string => typeof x === "string");
    } catch {}
    setIds(list.filter((id) => id !== currentId).slice(0, 8));
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([currentId, ...list.filter((id) => id !== currentId)].slice(0, RECENT_MAX)));
    } catch {}
  }, [currentId]);
  return ids;
}

function ProductRow({ products }: { products: Product[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <ul className="flex snap-x snap-mandatory gap-4 sm:grid sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-[30px]">
        {products.map((p) => (
          <li key={p.id} className="w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductRecommendations({ currentId, related }: { currentId: string; related: Product[] }) {
  const recentIds = useRecentlyViewed(currentId);
  const { products: recentRaw } = useProductsByIds(recentIds);
  const recent = useMemo(() => {
    const byId = new Map(recentRaw.map((p) => [p.id, p]));
    return recentIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  }, [recentRaw, recentIds]);

  const [tab, setTab] = useState<"related" | "recent">("related");
  const hasRelated = related.length > 0;
  const hasRecent = recent.length > 0;
  const current = tab === "recent" && hasRecent ? "recent" : hasRelated ? "related" : "recent";

  if (!hasRelated && !hasRecent) return null;

  const heading = (id: "related" | "recent", label: string) => {
    const active = current === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        aria-pressed={active}
        className={`relative pb-1 text-2xl font-medium transition-colors sm:text-[30px] sm:leading-[42px] ${active ? "text-ink" : "text-ink-secondary hover:text-ink"}`}
      >
        {label}
        <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-primary transition-transform ${active ? "scale-x-100" : "scale-x-0"}`} aria-hidden="true" />
      </button>
    );
  };

  return (
    <section className="mx-auto max-w-[1320px] px-4 py-12 sm:py-16 lg:px-[15px]" aria-labelledby="pdp-recs-heading">
      <h2 id="pdp-recs-heading" className="sr-only">
        More products
      </h2>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 sm:mb-10">
        {hasRelated && heading("related", "You May Also Like")}
        {hasRecent && heading("recent", "Recently Viewed")}
      </div>
      <ProductRow products={current === "related" ? related : recent} />
    </section>
  );
}
