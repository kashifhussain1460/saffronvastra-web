"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

interface ProductLightboxProps {
  open: boolean;
  images: string[];
  alts: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Full-screen luxury photo viewer:
 * - Mounted at document.body via React Portal to prevent CSS stacking context leaks
 * - Absolute opaque dark background (no bleed-through of page tabs, swatches, or sticky headers)
 * - Complete window scroll locking
 * - Left/Right arrows, keyboard navigation (Left/Right/Escape), swipe, click-to-zoom
 */
export default function ProductLightbox({
  open,
  images,
  alts,
  index,
  onIndexChange,
  onClose,
  returnFocusRef,
}: ProductLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const count = images.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const go = (delta: number) => {
    setZoomed(false);
    onIndexChange((index + delta + count) % count);
  };

  // Lock both body and documentElement scroll while the lightbox is open
  useEffect(() => {
    if (!open) return;
    const previous = (document.activeElement as HTMLElement) || null;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      (returnFocusRef?.current || previous)?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keyboard navigation & focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" && count > 1) {
        go(1);
      } else if (e.key === "ArrowLeft" && count > 1) {
        go(-1);
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Reset zoom whenever open state or active image index changes
  useEffect(() => {
    setZoomed(false);
  }, [open, index]);

  if (!open || !mounted) return null;

  const content = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Product photography viewer"
      className="fixed inset-0 z-[99999] flex flex-col bg-[#0F0E0E] text-white select-none"
      style={{ touchAction: "none" }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || zoomed) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* Top Controls Bar */}
      <div className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-8">
        {/* Photo Counter */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm font-medium tracking-wider text-white/90" aria-live="polite">
            {index + 1} <span className="text-white/40">/</span> {count}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            title={zoomed ? "Zoom out (Click image to toggle)" : "Zoom in (Click image to toggle)"}
          >
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close zoom"
            title="Close zoom (Esc)"
          >
            <X className="h-6 w-6 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`absolute inset-4 sm:inset-x-20 sm:inset-y-8 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            setZoomed((z) => !z);
          }}
          onMouseMove={(e) => {
            if (!zoomed) return;
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
        >
          <Image
            key={images[index]}
            src={images[index]}
            alt={alts[index] || ""}
            fill
            priority
            sizes="100vw"
            className="object-contain transition-transform duration-200"
            style={{
              transform: zoomed ? "scale(2.2)" : "scale(1)",
              transformOrigin: origin,
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white shadow-xl backdrop-blur-md transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-primary sm:left-8"
              aria-label="Previous photo"
              title="Previous photo (Left Arrow)"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white shadow-xl backdrop-blur-md transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-primary sm:right-8"
              aria-label="Next photo"
              title="Next photo (Right Arrow)"
            >
              <ChevronRight className="h-6 w-6 stroke-[2]" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
