"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";

/**
 * Base shimmer primitive with luxury gold/cream undertones and sweeping light highlight
 */
export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-md ${className}`}
      {...props}
    />
  );
}

/**
 * SkeletonImage: Enhances next/image with an integrated luxury shimmer overlay.
 * Fades out smoothly as soon as the image decodes.
 */
interface SkeletonImageProps extends ImageProps {
  wrapperClassName?: string;
  shimmerClassName?: string;
}

export function SkeletonImage({
  wrapperClassName = "",
  shimmerClassName = "",
  className = "",
  alt,
  onLoad,
  ...props
}: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Background Shimmer Wave */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 skeleton-shimmer z-0 transition-opacity duration-500 ease-out ${
          loaded ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${shimmerClassName}`}
      />

      <Image
        alt={alt}
        className={`transition-opacity duration-700 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          if (onLoad) onLoad(e);
        }}
        {...props}
      />
    </div>
  );
}

/**
 * ProductCardSkeleton: Mirror of Modave ProductCard
 * (Aspect 3:4 image well, badges, title lines, star reviews, price tag)
 */
export function ProductCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-full flex-col bg-canvas ${className}`}>
      {/* 3:4 Image Well */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg skeleton-shimmer">
        {/* Mock Badge */}
        <div className="absolute left-2.5 top-2.5 z-10">
          <Skeleton className="h-5 w-16 rounded-full bg-white/60" />
        </div>
      </div>

      {/* Meta Content */}
      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        {/* Category Pill */}
        <Skeleton className="h-3 w-20 mb-2 rounded bg-stone-200/80" />

        {/* Product Title (2 staggered lines) */}
        <Skeleton className="h-4 w-5/6 mb-1.5 rounded bg-stone-300/80" />
        <Skeleton className="h-4 w-3/5 mb-3 rounded bg-stone-300/80" />

        {/* Price & Rating Row */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded bg-stone-300/80" />
            <Skeleton className="h-4 w-14 rounded bg-stone-200/70" />
          </div>
          {/* Star dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-2.5 w-2.5 rounded-full bg-stone-200/70" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductGridSkeleton: Responsive grid of product card skeletons
 */
export function ProductGridSkeleton({
  count = 8,
  columns = "4",
  className = "",
}: {
  count?: number;
  columns?: "2" | "3" | "4";
  className?: string;
}) {
  const gridClasses = {
    "2": "grid-cols-2",
    "3": "grid-cols-2 md:grid-cols-3",
    "4": "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div
      role="status"
      aria-label="Loading products"
      className={`grid gap-x-[15px] gap-y-[30px] xl:gap-x-[30px] xl:gap-y-10 ${gridClasses[columns]} ${className}`}
    >
      <span className="sr-only">Loading products...</span>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * ProductShelfSkeleton: Complete section skeleton with title, subtitle, and card row
 */
export function ProductShelfSkeleton({ className = "" }: { className?: string }) {
  return (
    <section aria-hidden="true" className={`py-12 lg:py-16 bg-canvas ${className}`}>
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Section Heading Skeleton */}
        <div className="text-center max-w-xl mx-auto mb-10 lg:mb-12">
          <Skeleton className="h-6 w-28 mx-auto mb-3 rounded-full bg-stone-200/80" />
          <Skeleton className="h-9 w-72 mx-auto mb-3 rounded-lg bg-stone-300/80" />
          <Skeleton className="h-4 w-96 max-w-full mx-auto rounded bg-stone-200/70" />
        </div>

        {/* 4 Cards Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * CategoryCardSkeleton: Mirror of the 2 focused collection showcase cards
 */
export function CategoryCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col rounded-3xl overflow-hidden bg-white border border-line shadow-sm">
      {/* 3:4 or 4:5 Image Well */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full skeleton-shimmer">
        {/* Top Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Skeleton className="h-6 w-24 rounded-full bg-white/70" />
        </div>
        {/* Title over bottom scrim */}
        <div className="absolute bottom-6 inset-x-6 z-10">
          <Skeleton className="h-8 w-44 rounded-lg bg-white/70" />
        </div>
      </div>

      {/* Text Details & CTA */}
      <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-full rounded bg-stone-200/80" />
          <Skeleton className="h-4 w-4/5 rounded bg-stone-200/80" />
        </div>
        <Skeleton className="h-12 w-full rounded-full bg-stone-200/80" />
      </div>
    </div>
  );
}

/**
 * CategoryGridSkeleton: Dual-card collection showcase skeleton for DynamicCollections
 */
export function CategoryGridSkeleton() {
  return (
    <section aria-label="Collections Loading" className="py-20 lg:py-28 bg-[#FAF8F5]">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Section Heading Skeleton */}
        <div className="text-center max-w-xl mx-auto mb-14 lg:mb-16">
          <Skeleton className="h-6 w-48 mx-auto mb-3 rounded-full bg-primary/10" />
          <Skeleton className="h-10 w-80 max-w-full mx-auto mb-4 rounded-lg bg-stone-300/80" />
          <Skeleton className="h-4 w-96 max-w-full mx-auto rounded bg-stone-200/70" />
        </div>

        {/* Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
        </div>
      </div>
    </section>
  );
}

/**
 * ProductDetailSkeleton: Full PDP skeleton mirroring ProductDetailClient layout
 */
export function ProductDetailSkeleton() {
  return (
    <div aria-label="Loading product details" role="status" className="py-8 md:py-12 bg-canvas">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-3 w-14 rounded" />
          <span className="text-stone-300">/</span>
          <Skeleton className="h-3 w-20 rounded" />
          <span className="text-stone-300">/</span>
          <Skeleton className="h-3 w-36 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* Gallery Skeleton (Left 7 Cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails Strip */}
            <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-md" />
              ))}
            </div>
            {/* Main Image Well */}
            <div className="flex-1 aspect-[3/4] rounded-2xl skeleton-shimmer" />
          </div>

          {/* Product Info Panel Skeleton (Right 5 Cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col">
            <Skeleton className="h-5 w-28 rounded-full mb-3 bg-primary/15" />
            <Skeleton className="h-9 w-4/5 rounded-lg mb-3 bg-stone-300" />
            <Skeleton className="h-4 w-36 rounded mb-5" />

            {/* Price Row */}
            <div className="flex items-baseline gap-3 mb-6">
              <Skeleton className="h-8 w-28 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>

            <div className="border-t border-line my-6" />

            {/* Sizes */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <div className="flex gap-2">
                {["XS", "S", "M", "L", "XL"].map((s) => (
                  <Skeleton key={s} className="h-11 w-14 rounded-lg" />
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-6">
              <Skeleton className="h-13 flex-1 rounded-full bg-stone-800/80" />
              <Skeleton className="h-13 w-13 rounded-full" />
            </div>

            {/* Trust highlights */}
            <div className="rounded-xl border border-line p-4 space-y-3 bg-[#FAF8F5]">
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

/**
 * CatalogPageSkeleton: Full page skeleton for /collections, /collections/[slug], and /search
 */
export function CatalogPageSkeleton({ title = "Collections" }: { title?: string }) {
  return (
    <div aria-label={`Loading ${title}`} role="status" className="min-h-screen bg-canvas">
      {/* ShopPageTitle Banner Skeleton */}
      <div className="relative py-14 lg:py-20 bg-stone-100/70 border-b border-line overflow-hidden">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 text-center">
          <Skeleton className="h-4 w-32 mx-auto mb-3 rounded" />
          <Skeleton className="h-10 w-64 max-w-full mx-auto mb-3 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full mx-auto rounded" />
        </div>
      </div>

      {/* Toolbar & Product Grid Skeleton */}
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Toolbar skeleton */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-line/60">
          <Skeleton className="h-10 w-28 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-lg hidden sm:block" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>

        {/* 8 Product Skeletons Grid */}
        <ProductGridSkeleton count={8} columns="4" />
      </div>
    </div>
  );
}
