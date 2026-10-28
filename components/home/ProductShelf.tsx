"use client";

import React from "react";
import { Product } from "@/types";
import ProductCard from "@/components/ui/ProductCard";
import Carousel from "./Carousel";
import SectionHeading, { CONTAINER } from "./SectionHeading";

interface ProductShelfProps {
  id: string;
  title: string;
  subtitle?: string;
  products: Product[];
  className?: string;
}

// Modave product row ("Today's Top Picks"): 4 cards per view on desktop, 3 on tablets, 2 on phones.
export default function ProductShelf({ id, title, subtitle, products, className = "" }: ProductShelfProps) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className={`bg-canvas ${className}`}>
      <div className={CONTAINER}>
        <SectionHeading id={id} title={title} subtitle={subtitle} />
        <Carousel
          label={title}
          gapClassName="gap-[15px] md:gap-[30px]"
          slideClassName="basis-[calc((100%-15px)/2)] md:basis-[calc((100%-60px)/3)] lg:basis-[calc((100%-90px)/4)]"
          arrowTopClassName="top-[38%]"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
