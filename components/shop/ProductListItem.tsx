"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import PriceTag from "@/components/ui/PriceTag";
import QuickView from "./QuickView";
import { ShopProduct } from "./shopData";

/** Modave list-view row: photo left, title / price / description / colours / sizes / actions right. */
export default function ProductListItem({ product }: { product: ShopProduct }) {
  const { toggleWishlist, isInWishlist } = useStore();
  const [quick, setQuick] = useState<null | "view" | "add">(null);
  const isFav = isInWishlist(product.id);
  const hasCompare = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasCompare ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const secondImage = product.secondImage;

  return (
    <article className="group flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:gap-6 lg:gap-10 lg:pb-10">
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:w-[42%] lg:w-[336px]">
        <Link href={`/products/${product.slug}`} className="block h-full w-full" tabIndex={-1} aria-label={product.title}>
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 639px) 100vw, 340px"
            className={`object-cover object-top transition-opacity duration-700 ${secondImage ? "lg:group-hover:opacity-0" : ""}`}
          />
          {secondImage && (
            <Image src={secondImage} alt="" aria-hidden="true" fill sizes="340px" className="hidden object-cover object-top opacity-0 transition-opacity duration-700 lg:block lg:group-hover:opacity-100" />
          )}
        </Link>
        {hasCompare && discount > 0 && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-on-primary">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:pt-2">
        <Link href={`/products/${product.slug}`} className="self-start">
          <h3 className="text-lg font-medium leading-snug text-ink transition-colors hover:text-primary-hover lg:text-[22px]">{product.title}</h3>
        </Link>
        <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} comparePosition="before" showDiscount={false} size="md" />
        {(product.subtitle || product.description) && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-secondary lg:text-base">{product.subtitle || product.description}</p>
        )}
        <p className="text-sm text-ink-muted">
          {product.availabilityMode} &middot; ships in {product.leadTime}
        </p>

        {product.variantColours.some((c) => c.hex) && (
          <ul className="flex flex-wrap gap-1.5" aria-label={`Colours: ${product.variantColours.map((c) => c.name).join(", ")}`}>
            {product.variantColours.map((c, i) => (
              <li key={c.name} title={c.name} className={`grid h-7 w-7 place-items-center rounded-full border ${i === 0 ? "border-ink" : "border-transparent"}`}>
                <span className="h-5 w-5 rounded-full border border-line" style={{ backgroundColor: c.hex }} />
              </li>
            ))}
          </ul>
        )}
        {product.variantSizes.length > 0 && (
          <p className="flex flex-wrap gap-2" aria-label={`Sizes: ${product.variantSizes.join(", ")}`}>
            {product.variantSizes.map((s) => (
              <span key={s} aria-hidden="true" className="grid h-10 min-w-10 place-items-center rounded-full border border-line px-2 text-sm text-ink lg:h-12 lg:min-w-12">
                {s}
              </span>
            ))}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setQuick("add")}
            aria-label={`Quick add ${product.title}`}
            className="h-11 min-w-0 flex-1 rounded-full border border-line px-6 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-primary hover:bg-primary hover:text-on-primary sm:max-w-[272px] lg:h-12"
          >
            Quick add
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-pressed={isFav}
            aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-primary hover:bg-primary hover:text-on-primary lg:h-12 lg:w-12"
          >
            <Heart className={`h-[18px] w-[18px] ${isFav ? "fill-secondary text-secondary" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setQuick("view")}
            aria-label={`Quick view ${product.title}`}
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-primary hover:bg-primary hover:text-on-primary lg:h-12 lg:w-12"
          >
            <Eye className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      {quick && <QuickView product={product} open mode={quick} onClose={() => setQuick(null)} />}
    </article>
  );
}
