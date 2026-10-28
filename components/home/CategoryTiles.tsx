"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Carousel from "./Carousel";
import SectionHeading, { CONTAINER, SECTION_Y } from "./SectionHeading";

interface Tile {
  key: string;
  title: string;
  href: string;
  img: string | null;
  count: number | null;
}

// First real photo among the given products (products without photos carry the brand logo).
const firstPhoto = (products: any[] | undefined): string | null => {
  for (const product of products ?? []) {
    const img = Array.isArray(product?.images) ? product.images[0] : null;
    const url = (typeof img === "string" ? img : img?.url) || null;
    if (url && !url.startsWith("/images/brand/")) return url;
  }
  return null;
};

const getJson = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

// Modave "Popular Categories": rounded square image tiles with name and item count.
// Built only from the live categories and collections; a tile without its own image shows
// the cover photo of one of its products. The section hides when the store has neither.
export default function CategoryTiles() {
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cats, cols] = await Promise.all([
        getJson("/api/v1/categories").then((b) => (Array.isArray(b?.data) ? b.data : [])).catch(() => []),
        getJson("/api/v1/collections").then((b) => (Array.isArray(b?.data) ? b.data : [])).catch(() => []),
      ]);
      const list: Tile[] = [
        ...cats.map((c: any) => ({
          key: `cat-${c.slug}`,
          title: c.name,
          href: `/collections?category=${encodeURIComponent(c.slug)}`,
          img: c.image || null,
          count: typeof c.productsCount === "number" ? c.productsCount : null,
        })),
        ...cols.map((c: any) => ({
          key: `col-${c.slug}`,
          title: c.title,
          href: `/collections/${encodeURIComponent(c.slug)}`,
          img: c.bannerImage || null,
          count: typeof c.productsCount === "number" ? c.productsCount : null,
        })),
      ];
      if (cancelled) return;
      setTiles(list);

      // Fill missing images with a real product photo from that category / collection.
      const filled = await Promise.all(
        list.map(async (t) => {
          if (t.img) return t;
          try {
            if (t.key.startsWith("cat-")) {
              const slug = t.key.slice(4);
              const body = await getJson(`/api/v1/products?category=${encodeURIComponent(slug)}&limit=24`);
              return { ...t, img: firstPhoto(body?.items) };
            }
            const body = await getJson(`/api/v1/collections/${encodeURIComponent(t.key.slice(4))}`);
            return { ...t, img: firstPhoto(body?.data?.products) };
          } catch {
            return t;
          }
        })
      );
      if (!cancelled) setTiles(filled);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="home-categories-title" className={`bg-canvas ${SECTION_Y}`}>
      <div className={CONTAINER}>
        <SectionHeading id="home-categories-title" title="Shop by Category" />
        <Carousel
          label="Shop by category"
          gapClassName="gap-[15px]"
          slideClassName="basis-[calc((100%-15px)/2)] md:basis-[calc((100%-45px)/4)] lg:basis-[calc((100%-75px)/6)]"
          arrowTopClassName="top-[38%]"
          centerFew
        >
          {tiles.map((tile) => (
            <Link key={tile.key} href={tile.href} className="group flex flex-col items-center text-center">
              <span className="relative block aspect-square w-full overflow-hidden rounded-[48px] bg-surface-muted">
                {tile.img && (
                  <Image
                    src={tile.img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 17vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-base font-medium leading-6 text-ink transition-colors group-hover:text-primary-hover xl:text-xl xl:leading-7">
                {tile.title}
                <ArrowUpRight
                  className="h-4 w-0 opacity-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </span>
              {tile.count !== null && (
                <span className="mt-1 text-base leading-[26px] text-ink-secondary">
                  {tile.count} {tile.count === 1 ? "item" : "items"}
                </span>
              )}
            </Link>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
