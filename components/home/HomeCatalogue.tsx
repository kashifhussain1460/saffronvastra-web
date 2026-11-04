"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import ProductShelf from "./ProductShelf";
import PromoBanners from "./PromoBanners";
import ServiceHighlights from "./ServiceHighlights";
import ShopTheLook from "./ShopTheLook";
import { SECTION_BOTTOM, SECTION_Y } from "./SectionHeading";
import { ProductShelfSkeleton } from "@/components/ui/Skeleton";
import { HOME_PRODUCT_QUERIES, buildHomeCatalogue, type HomeCatalogueData } from "./homeData";

async function loadProducts(url: string, keep: (raw: any) => boolean = () => true): Promise<Product[]> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    return Array.isArray(body?.items) ? body.items.filter(keep).map(mapBackendProductToFrontend) : [];
  } catch (err) {
    console.warn(`Could not load home products (${url}):`, err);
    return [];
  }
}

interface CatalogueState extends HomeCatalogueData {
  loading: boolean;
}

interface HomeCatalogueProps {
  /** Shelves built on the server from the same queries. When present they render straight away and nothing is
   * fetched here; when absent (the API was unreachable while the page rendered) the browser loads them as before. */
  initialData?: HomeCatalogueData;
}

// The product-driven part of the home page:
// Featured Suzani products row, paired banners, second product row, service icons, "shop the look" gallery.
export default function HomeCatalogue({ initialData }: HomeCatalogueProps) {
  const [state, setState] = useState<CatalogueState>(
    initialData
      ? { loading: false, ...initialData }
      : {
          loading: true,
          first: null,
          second: null,
          look: [],
        }
  );
  const hasInitialData = Boolean(initialData);

  useEffect(() => {
    if (hasInitialData) return;
    let cancelled = false;
    (async () => {
      try {
        const [bestsellers, newArrivals, featuredRaw, latest] = await Promise.all(
          HOME_PRODUCT_QUERIES.map((url) => loadProducts(url))
        );
        if (cancelled) return;

        setState({ loading: false, ...buildHomeCatalogue(bestsellers, newArrivals, featuredRaw, latest) });
      } catch (e) {
        if (!cancelled) {
          setState({ loading: false, first: null, second: null, look: [] });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasInitialData]);

  const { loading, first, second, look } = state;

  if (loading) {
    return (
      <>
        <ProductShelfSkeleton className={SECTION_BOTTOM} />
        <PromoBanners />
        <ProductShelfSkeleton className={SECTION_Y} />
        <div className="pt-[60px] xl:pt-20">
          <ServiceHighlights />
        </div>
      </>
    );
  }

  return (
    <>
      {first && first.products.length > 0 && (
        <ProductShelf id="home-shelf-1" {...first} className={SECTION_BOTTOM} />
      )}
      <PromoBanners />
      {second && second.products.length > 0 && (
        <ProductShelf id="home-shelf-2" {...second} className={SECTION_Y} />
      )}
      <div className={second && second.products.length > 0 ? "" : "pt-[60px] xl:pt-20"}>
        <ServiceHighlights />
      </div>
      {look.length > 0 && <ShopTheLook products={look} />}
    </>
  );
}
