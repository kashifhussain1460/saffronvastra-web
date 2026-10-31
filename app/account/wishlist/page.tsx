"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProductsByIds } from "@/lib/useProductsByIds";
import { Product, Size, ProductColor } from "@/types";
import { useStore } from "@/context/StoreContext";
import PriceTag from "@/components/ui/PriceTag";
import PageTitle from "@/components/checkout/PageTitle";
import { Heart, X, Check, ArrowUpRight, ChevronLeft, ChevronDown } from "lucide-react";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, openCart } = useStore();

  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "name">("newest");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, Size>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, ProductColor>>({});
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  // Saved ids are resolved through the catalogue API; unpublished products drop out.
  const { products: savedProducts, status: savedStatus } = useProductsByIds(wishlist);
  const unavailableCount = savedStatus === "ready" ? Math.max(wishlist.length - savedProducts.length, 0) : 0;

  const wishlistProducts = useMemo(() => {
    return [...savedProducts].sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.title.localeCompare(b.title);
      return 0; // "newest" keeps the order the items were saved in
    });
  }, [savedProducts, sortBy]);

  const handleAddToCart = (product: Product) => {
    const size = selectedSizes[product.id] || product.sizes[0] || "M";
    const color = selectedColors[product.id] || product.colors[0];

    addToCart(product, size, color, 1);

    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }));
      openCart();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface text-ink">
      <PageTitle
        title="My Wishlist"
        crumbs={[{ label: "Homepage", href: "/" }, { label: "My Account", href: "/account" }, { label: "Wishlist" }]}
      />

      <section className="max-w-[1320px] mx-auto px-4 lg:px-[15px] py-10 md:py-16 lg:py-20">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="hidden sm:inline-flex items-center gap-1 min-h-11 text-base text-ink-secondary hover:text-primary-hover transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> My Account
            </Link>
            <p className="text-base text-ink" aria-live="polite">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"}
            </p>
          </div>
          {wishlistProducts.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="wishlist-sort" className="text-base text-ink-secondary hidden sm:inline">
                Sort by:
              </label>
              <div className="relative">
              <select
                id="wishlist-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none h-11 md:h-10 pl-4 pr-10 rounded-full border-2 border-line bg-surface text-base font-medium text-ink focus:outline-none focus:border-ink"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink" />
              </div>
            </div>
          )}
        </div>

        {savedStatus === "error" && (
          <p role="alert" className="text-base text-error mb-4">
            We could not load your saved items right now. Please try again shortly.
          </p>
        )}
        {unavailableCount > 0 && (
          <p role="status" className="text-base text-ink-secondary mb-4">
            {unavailableCount} saved {unavailableCount === 1 ? "item is" : "items are"} no longer available.
          </p>
        )}

        {savedStatus === "loading" ? (
          <div className="py-6">
            <ProductGridSkeleton count={4} columns="4" />
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-6 md:py-10">
            <div className="w-24 h-24 mx-auto rounded-full bg-surface-muted grid place-items-center mb-6">
              <Heart className="w-10 h-10 text-ink stroke-[1.25]" aria-hidden="true" />
            </div>
            <h2 className="text-2xl md:text-[28px] font-medium text-ink mb-2">Your Wishlist is Empty</h2>
            <p className="text-base text-ink-secondary mb-8 leading-relaxed">
              Explore our luxury embroidered jackets, handworked velvet kimonos, and timeless co-ord sets to curate your
              bespoke collection.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors"
            >
              Explore Collections <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-[30px] md:gap-y-10">
            {wishlistProducts.map((product) => {
              const currentSize = selectedSizes[product.id] || product.sizes[0] || "M";
              const currentColor = selectedColors[product.id] || product.colors[0];
              const isAdded = addedMap[product.id];

              return (
                <li key={product.id} className="group min-w-0">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-muted">
                    <Link href={`/products/${product.slug}`} aria-label={product.title} className="absolute inset-0">
                      <Image
                        src={product.images[0] || "/images/brand/saffronvastra-mark.png"}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      className="absolute top-2 right-2 md:top-3 md:right-3 w-11 h-11 md:w-10 md:h-10 grid place-items-center rounded-full bg-surface text-ink shadow-card hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdded}
                      className={`hidden md:inline-flex absolute left-3 right-3 bottom-3 h-11 items-center justify-center gap-1.5 rounded-full text-base font-semibold transition-all md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:focus-visible:opacity-100 md:focus-visible:translate-y-0 ${
                        isAdded
                          ? "bg-success text-on-primary md:opacity-100 md:translate-y-0"
                          : "bg-surface text-ink hover:bg-primary hover:text-on-primary"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" aria-hidden="true" /> Added to Bag
                        </>
                      ) : (
                        "Add to Cart"
                      )}
                    </button>
                  </div>

                  <div className="pt-3 md:pt-4">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm md:text-base text-ink hover:text-primary-hover transition-colors line-clamp-1"
                    >
                      {product.title}
                    </Link>
                    <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} className="mt-1" />

                    {product.colors && product.colors.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1 mt-2.5" role="group" aria-label="Colour">
                        {product.colors.map((color) => {
                          const isSelected = currentColor?.name === color.name;
                          return (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => setSelectedColors((prev) => ({ ...prev, [product.id]: color }))}
                              title={color.name}
                              aria-label={`Select ${color.name}`}
                              aria-pressed={isSelected}
                              className={`w-8 h-8 grid place-items-center rounded-full border transition-colors ${
                                isSelected ? "border-ink" : "border-transparent hover:border-line-strong"
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full border border-line" style={{ backgroundColor: color.hex }} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2" role="group" aria-label="Size">
                        {product.sizes.map((sz) => {
                          const isSelected = currentSize === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: sz }))}
                              aria-pressed={isSelected}
                              className={`min-w-9 h-9 md:min-w-8 md:h-8 px-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                isSelected ? "bg-primary text-on-primary border-primary" : "bg-surface text-ink border-line hover:border-ink"
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdded}
                      className={`md:hidden mt-3 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
                        isAdded ? "bg-success text-on-primary" : "bg-primary hover:bg-primary-hover text-on-primary"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" aria-hidden="true" /> Added to Bag
                        </>
                      ) : (
                        "Add to Cart"
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
