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

const SHELF_SIZE = 8;
// Products saved without photos get the brand logo as their image; rows and the gallery prefer pieces with photos.
const PLACEHOLDER_IMAGE = "/images/brand/";
const hasPhoto = (p: Product) => Boolean(p.images[0]) && !p.images[0].startsWith(PLACEHOLDER_IMAGE);
const photosFirst = (list: Product[]) => [...list.filter(hasPhoto), ...list.filter((p) => !hasPhoto(p))];

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

interface Shelf {
  title: string;
  subtitle: string;
  products: Product[];
}

interface CatalogueState {
  loading: boolean;
  first: Shelf | null;
  second: Shelf | null;
  look: Product[];
}

// The product-driven part of the home page:
// Featured Suzani products row, paired banners, second product row, service icons, "shop the look" gallery.
export default function HomeCatalogue() {
  const [state, setState] = useState<CatalogueState>({
    loading: true,
    first: null,
    second: null,
    look: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bestsellers, newArrivals, featuredRaw, latest] = await Promise.all([
          loadProducts(`/api/v1/products?bestseller=true&limit=${SHELF_SIZE}`),
          loadProducts(`/api/v1/products?newArrival=true&limit=${SHELF_SIZE}`),
          loadProducts(`/api/v1/products?sort=featured&limit=${SHELF_SIZE}`),
          loadProducts(`/api/v1/products?sort=newest&limit=48`),
        ]);
        if (cancelled) return;

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

        setState({ loading: false, first, second, look });
      } catch (e) {
        if (!cancelled) {
          setState({ loading: false, first: null, second: null, look: [] });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
