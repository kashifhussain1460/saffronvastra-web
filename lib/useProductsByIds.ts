"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";

export type ProductsByIdsStatus = "loading" | "ready" | "error";

/**
 * Resolves product ids (for example the saved wishlist) through the catalogue API.
 * Only published products come back, so an item that was unpublished or deleted
 * simply drops out instead of being shown from a stale copy.
 */
export function useProductsByIds(ids: string[]): { products: Product[]; status: ProductsByIdsStatus } {
  const key = ids.slice(0, 50).join(",");
  const [state, setState] = useState<{ products: Product[]; status: ProductsByIdsStatus }>({
    products: [],
    status: key ? "loading" : "ready",
  });

  useEffect(() => {
    if (!key) {
      setState({ products: [], status: "ready" });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));
    fetch(`/api/v1/products/by-ids?ids=${encodeURIComponent(key)}`)
      .then((res) => {
        if (!res.ok) throw new Error("catalogue");
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        setState({ products: (body.items || []).map(mapBackendProductToFrontend), status: "ready" });
      })
      .catch(() => {
        if (!cancelled) setState({ products: [], status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
