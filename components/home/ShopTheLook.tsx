"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Product } from "@/types";
import Carousel from "./Carousel";
import SectionHeading, { CONTAINER, SECTION_BOTTOM } from "./SectionHeading";

// Modave "Shop Instagram" layout, filled with our own product photos: every tile links to the real
// product page (we have no Instagram feed, so nothing here pretends to be one).
export default function ShopTheLook({ products }: { products: Product[] }) {
  if (products.length < 2) return null;
  return (
    <section aria-labelledby="home-look-title" className={`bg-canvas ${SECTION_BOTTOM}`}>
      <div className={CONTAINER}>
        <SectionHeading id="home-look-title" title="Shop the Look" subtitle="Our handcrafted pieces, up close." />
        <Carousel
          label="Shop the look"
          gapClassName="gap-[10px]"
          slideClassName="basis-[calc((100%-10px)/2)] md:basis-[calc((100%-20px)/3)] lg:basis-[calc((100%-40px)/5)]"
          arrowTopClassName="top-1/2"
        >
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              aria-label={`View product: ${p.title}`}
              className="group relative block aspect-square overflow-hidden rounded-lg bg-surface-muted"
            >
              <Image
                src={p.images[1] || p.images[0]}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-inverse/0 transition-colors duration-300 lg:group-hover:bg-inverse/20"
              />
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink transition-opacity duration-300 lg:h-10 lg:w-10 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100"
              >
                <Eye className="h-[18px] w-[18px] lg:h-6 lg:w-6" strokeWidth={1.5} />
              </span>
            </Link>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
