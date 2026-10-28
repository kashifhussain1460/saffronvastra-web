"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import PriceTag from "@/components/ui/PriceTag";
import type { Size } from "@/types";

interface StickyAddToCartProps {
  /** element whose leaving the viewport reveals the bar (the main add-to-cart row) */
  watchRef: React.RefObject<HTMLElement | null>;
  image: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  summary: string;
  sizes: Size[];
  selectedSize: Size | null;
  isSizeAvailable: (s: Size) => boolean;
  onSizeChange: (s: Size) => void;
  onAdd: () => void;
  disabled?: boolean;
  disabledLabel?: string;
}

/**
 * Modave "tf-sticky-btn-atc": a bar fixed to the bottom of the screen that appears once the
 * main add-to-cart row has scrolled out of view. Sits above the mobile bottom tab bar.
 * It is not rendered at all while hidden, so it never duplicates controls for assistive tech.
 */
export default function StickyAddToCart({
  watchRef,
  image,
  title,
  price,
  compareAtPrice,
  summary,
  sizes,
  selectedSize,
  isSizeAvailable,
  onSizeChange,
  onAdd,
  disabled,
  disabledLabel,
}: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = watchRef.current;
      // show only once the row has been scrolled past (not while it is still below the fold)
      setVisible(!!el && el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [watchRef]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 z-30 border-t border-line bg-surface shadow-[0_-4px_16px_rgb(var(--color-ink)/0.08)]"
      style={{ bottom: "var(--bottom-nav-h, 0px)" }}
      data-testid="pdp-sticky-bar"
    >
      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2.5 sm:gap-5 sm:py-3 lg:px-[15px]">
        <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-muted">
            <Image src={image} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-ink">{title}</p>
            {summary && <p className="truncate text-sm text-ink-muted">{summary}</p>}
            <PriceTag price={price} compareAtPrice={compareAtPrice} className="text-sm font-semibold" />
          </div>
        </div>

        {sizes.length > 1 && (
          <label className="flex shrink-0 items-center gap-2 text-base text-ink">
            <span className="hidden sm:inline">Size:</span>
            <span className="sr-only sm:hidden">Size</span>
            <select
              value={selectedSize ?? ""}
              onChange={(e) => e.target.value && onSizeChange(e.target.value as Size)}
              className="h-11 rounded-lg border border-line bg-surface pl-3 pr-8 text-base text-ink focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                Choose
              </option>
              {sizes.map((s) => (
                <option key={s} value={s} disabled={!isSizeAvailable(s)}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="h-11 min-w-0 flex-1 rounded-full bg-primary px-5 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:flex-none md:px-10"
        >
          {disabled ? disabledLabel || "Unavailable" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
