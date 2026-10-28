"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import PriceTag from "./PriceTag";
import QuickView from "@/components/shop/QuickView";

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Optional: next/image `sizes` for the photo (defaults to a 2/3/4-column grid). */
  imageSizes?: string;
  /** Optional: load the photo eagerly (first row of a listing). */
  priority?: boolean;
  /** Optional: hide the hover actions (wishlist / quick view / quick add). Default shown. */
  showActions?: boolean;
}

// The mapper uses "Standard" when a product has no variant colours; that is not a real colour to show.
const realColours = (p: Product) => (p.colors || []).filter((c) => c.name && c.name !== "Standard" && c.hex);

/**
 * Modave product card: rounded photo well, second photo on hover, round action buttons on the right
 * (wishlist / quick view) and a "Quick add" pill along the bottom. On touch screens (below lg) the
 * actions stay visible. Quick add opens the variant picker, so nothing is added without a real variant.
 */
export default function ProductCard({
  product,
  className = "",
  imageSizes = "(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw",
  priority = false,
  showActions = true,
}: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useStore();
  const [quick, setQuick] = useState<null | "view" | "add">(null);

  const isFavorited = isInWishlist(product.id);
  const hasCompare = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasCompare ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const secondImage = product.images.length > 1 ? product.images[1] : null;
  const colours = realColours(product);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const iconBtn =
    "relative grid h-8 w-8 place-items-center rounded-full bg-surface text-ink shadow-sm transition-all duration-300 hover:bg-primary hover:text-on-primary lg:h-10 lg:w-10 before:absolute before:-inset-1.5 before:content-[''] lg:before:hidden";
  // Hidden until hover/focus on desktop (lg+); always visible on touch layouts.
  const reveal =
    "lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100";
  const slideIn = "lg:translate-x-3 lg:group-hover:translate-x-0 lg:group-focus-within:translate-x-0";

  return (
    <div className={`group relative flex h-full flex-col bg-canvas ${className}`}>
      {/* Image well */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface-muted">
        <Link href={`/products/${product.slug}`} className="block h-full w-full" aria-label={product.title} tabIndex={-1}>
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            priority={priority}
            sizes={imageSizes}
            className={`object-cover object-top transition-all duration-700 ease-out ${
              secondImage ? "lg:group-hover:opacity-0" : "lg:group-hover:scale-105"
            }`}
          />
          {secondImage && (
            <Image
              src={secondImage}
              alt=""
              aria-hidden="true"
              fill
              sizes={imageSizes}
              className="hidden object-cover object-top opacity-0 transition-all duration-700 ease-out lg:block lg:scale-105 lg:group-hover:scale-100 lg:group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges: sale % comes from the compare price; flags from the catalogue */}
        {(hasCompare || (product.badges && product.badges.length > 0)) && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1 lg:left-3 lg:top-3">
            {hasCompare && discount > 0 && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-on-primary">-{discount}%</span>
            )}
            {product.badges?.[0] && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-primary">
                {product.badges[0] === "BESTSELLER" ? "Best seller" : product.badges[0] === "NEW" ? "New" : "Limited"}
              </span>
            )}
          </div>
        )}

        {/* Round actions (right) */}
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-2 lg:right-3 lg:top-3">
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isFavorited}
            title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
            className={`${iconBtn} ${isFavorited ? "" : `${reveal} ${slideIn}`}`}
          >
            <Heart className={`h-4 w-4 lg:h-[18px] lg:w-[18px] ${isFavorited ? "fill-secondary text-secondary" : ""}`} />
          </button>
          {showActions && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQuick("view");
              }}
              aria-label={`Quick view ${product.title}`}
              title="Quick view"
              className={`${iconBtn} ${reveal} ${slideIn} lg:delay-75`}
            >
              <Eye className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
            </button>
          )}
        </div>

        {/* Quick add pill (bottom) */}
        {showActions && (
          <div className={`absolute inset-x-2 bottom-2 z-10 transition-all duration-300 lg:inset-x-3.5 lg:bottom-3 lg:translate-y-3 lg:group-hover:translate-y-0 lg:group-focus-within:translate-y-0 ${reveal}`}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setQuick("add");
              }}
              aria-label={`Quick add ${product.title}`}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-surface text-[11px] font-semibold uppercase tracking-[0.08em] text-ink shadow-sm transition-colors hover:bg-primary hover:text-on-primary sm:text-xs lg:h-[42px]"
            >
              <ShoppingBag className="h-3.5 w-3.5 lg:hidden" aria-hidden="true" />
              Quick add
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 pt-3 lg:pt-4">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors hover:text-primary-hover sm:text-base sm:leading-6">
            {product.title}
          </h3>
        </Link>
        <PriceTag
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          comparePosition="before"
          showDiscount={false}
          size="md"
        />
        {colours.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap items-center gap-1.5" aria-label={`Colours: ${colours.map((c) => c.name).join(", ")}`}>
            {colours.slice(0, 5).map((color, i) => (
              <li key={color.name} title={color.name} className={`grid h-6 w-6 place-items-center rounded-full border ${i === 0 ? "border-ink" : "border-transparent"}`}>
                <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: color.hex }} />
              </li>
            ))}
            {colours.length > 5 && <li className="text-xs text-ink-muted">+{colours.length - 5}</li>}
          </ul>
        )}
      </div>

      {quick && <QuickView product={product} open={!!quick} mode={quick} onClose={() => setQuick(null)} />}
    </div>
  );
}
