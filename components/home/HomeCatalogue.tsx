"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import ProductShelf from "./ProductShelf";
import PromoBanners from "./PromoBanners";
import ServiceHighlights from "./ServiceHighlights";
import ShopTheLook from "./ShopTheLook";
import { SECTION_BOTTOM, SECTION_Y } from "./SectionHeading";

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
  first: Shelf | null;
  second: Shelf | null;
  look: Product[];
}

// The product-driven part of the home page, in Modave order:
// product row, paired banners, second product row, service icons, "shop the look" gallery.
// Rows are labelled by what they really contain: flagged best sellers / new arrivals / featured
// pieces when the admin has flagged some, otherwise the latest published pieces.
export default function HomeCatalogue() {
  const [state, setState] = useState<CatalogueState>({ first: null, second: null, look: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bestsellers, newArrivals, featured, latest] = await Promise.all([
        loadProducts(`/api/v1/products?bestseller=true&limit=${SHELF_SIZE}`),
        loadProducts(`/api/v1/products?newArrival=true&limit=${SHELF_SIZE}`),
        loadProducts(`/api/v1/products?sort=featured&limit=${SHELF_SIZE}`, (raw) => raw?.isFeatured === true),
        loadProducts(`/api/v1/products?sort=newest&limit=48`),
      ]);
      if (cancelled) return;
      const latestShelf: Shelf = {
        title: "Latest Pieces",
        subtitle: "Our newest handcrafted pieces.",
        products: photosFirst(latest).slice(0, SHELF_SIZE),
      };

      const first: Shelf =
        bestsellers.length > 0
          ? { title: "Best Sellers", subtitle: "Our most loved pieces.", products: bestsellers }
          : latestShelf;

      let second: Shelf | null = null;
      if (newArrivals.length > 0) {
        second = { title: "New Arrivals", subtitle: "Fresh from the atelier.", products: newArrivals };
      } else if (featured.length > 0) {
        second = { title: "Featured Pieces", subtitle: "Chosen by our atelier.", products: featured };
      } else if (first !== latestShelf) {
        second = latestShelf;
      }

      // Gallery: real product photos (skipping the logo placeholder used for products without photos).
      const seen = new Set<string>();
      const shown = new Set([...first.products, ...(second?.products ?? [])].map((p) => p.id));
      const look = [...latest.filter((p) => !shown.has(p.id)), ...latest, ...bestsellers, ...featured]
        .filter((p) => {
          if (seen.has(p.id) || !hasPhoto(p)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 10);

      setState({ first, second, look });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { first, second, look } = state;

  return (
    <>
      {first && <ProductShelf id="home-shelf-1" {...first} className={SECTION_BOTTOM} />}
      <PromoBanners />
      {second && <ProductShelf id="home-shelf-2" {...second} className={SECTION_Y} />}
      <div className={second ? "" : "pt-[60px] xl:pt-20"}>
        <ServiceHighlights />
      </div>
      <ShopTheLook products={look} />
    </>
  );
}
