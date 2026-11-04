"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import ProductLightbox from "./ProductLightbox";

interface ProductGalleryProps {
  images: string[];
  alts?: string[];
  title: string;
  badge?: string;
  discountLabel?: string;
}

/**
 * Modave-style gallery: vertical thumbnails on the left of the main image from lg up,
 * a swipeable (scroll-snap) main slider with a thumbnail strip and dots below it on smaller screens.
 * Clicking the main image or the expand button opens the lightbox.
 */
export default function ProductGallery({ images, alts = [], title, badge, discountLabel }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const altFor = (i: number) => alts[i] || `${title}, photo ${i + 1} of ${count}`;

  // The first photo is the LCP element. The other slides sit just off screen in the scroller and the thumbnails are in
  // view on mobile, so the browser would fetch every other photo at the same moment and they would share the
  // bandwidth with the first one. They are mounted once the first photo has loaded (or failed) and the page is idle,
  // so the first photo is painted first; until then their boxes show the same muted background they show while any
  // photo loads. Thumbnail 1 is the first photo's URL, so it is shown from the start.
  const firstImgRef = useRef<HTMLImageElement>(null);
  const [restReady, setRestReady] = useState(false);
  useEffect(() => {
    const img = firstImgRef.current;
    let idle = 0;
    let timer = 0;
    const done = () => {
      if (idle || timer) return;
      // Safari has no requestIdleCallback
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(() => setRestReady(true), { timeout: 1500 });
      else timer = window.setTimeout(() => setRestReady(true), 200);
    };
    // a photo that never settles must not keep the rest of the gallery empty
    const fallback = window.setTimeout(() => setRestReady(true), 4000);
    // already loaded (or already failed) before hydration
    if (!img || img.complete) done();
    else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
    return () => {
      img?.removeEventListener("load", done);
      img?.removeEventListener("error", done);
      window.clearTimeout(fallback);
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);
  const showPhoto = (i: number) => i === 0 || restReady || i === active;

  // keep the active index in sync with the swipe position
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === idx ? prev : Math.max(0, Math.min(count - 1, idx))));
  }, [count]);

  const goTo = useCallback(
    (idx: number, smooth = true) => {
      const next = (idx + count) % count;
      const el = trackRef.current;
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
      setActive(next);
    },
    [count]
  );

  // keep the active thumbnail visible inside its own strip (never scrolls the page)
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-thumb="${active}"]`);
    if (!strip || !thumb) return;
    const vertical = strip.scrollHeight > strip.clientHeight + 1 && strip.scrollWidth <= strip.clientWidth + 1;
    if (vertical) {
      const top = thumb.offsetTop - strip.clientHeight / 2 + thumb.clientHeight / 2;
      strip.scrollTo({ top, behavior: "smooth" });
    } else {
      const left = thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
      strip.scrollTo({ left, behavior: "smooth" });
    }
  }, [active]);

  // re-align the slider after a resize so the active slide stays in view
  useEffect(() => {
    const onResize = () => {
      const el = trackRef.current;
      if (el) el.scrollTo({ left: active * el.clientWidth, behavior: "auto" });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  return (
    <div className="flex flex-col xl:flex-row-reverse gap-3 xl:gap-5" data-testid="product-gallery">
      {/* Main image slider */}
      <div className="relative flex-1 min-w-0">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-xl bg-surface-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative w-full shrink-0 snap-start aspect-[3/4] bg-surface-muted overflow-hidden rounded-xl"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== active}
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                tabIndex={i === active ? 0 : -1}
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`Open photo ${i + 1} of ${count} in full screen`}
              >
                {showPhoto(i) && (
                  <Image
                    ref={i === 0 ? firstImgRef : undefined}
                    src={src}
                    alt={altFor(i)}
                    fill
                    // the first photo is the LCP element: fetched eagerly at high priority; the other slides load lazily
                    priority={i === 0}
                    fetchPriority={i === 0 ? "high" : undefined}
                    loading={i === 0 ? undefined : "lazy"}
                    sizes="(max-width: 767px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}
              </button>
            </div>
          ))}
        </div>

        {(badge || discountLabel) && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {discountLabel && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-on-primary">{discountLabel}</span>
            )}
            {badge && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-on-primary">
                {badge}
              </span>
            )}
          </div>
        )}

        <button
          ref={expandRef}
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-colors hover:bg-primary hover:text-on-primary"
          aria-label="Enlarge image"
        >
          <Expand className="h-4 w-4" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-colors hover:bg-primary hover:text-on-primary sm:flex"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-colors hover:bg-primary hover:text-on-primary sm:flex"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* dots (mobile) */}
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-4 bg-primary" : "w-1.5 bg-surface"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails: a row under the image below lg, a column on the left from lg */}
      {count > 1 && (
        <div className="xl:relative xl:w-20 xl:shrink-0">
        <div
          ref={thumbsRef}
          className="flex gap-2.5 overflow-x-auto xl:absolute xl:inset-0 xl:flex-col xl:overflow-x-hidden xl:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Choose a photo"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-thumb-${i}`}
              type="button"
              data-thumb={i}
              onClick={() => goTo(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={`relative aspect-[3/4] w-[calc((100%-4*0.625rem)/5)] shrink-0 overflow-hidden rounded border bg-surface-muted transition-colors sm:w-[calc((100%-5*0.625rem)/6)] md:w-[calc((100%-4*0.625rem)/5)] xl:w-full ${
                i === active ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              {showPhoto(i) && <Image src={src} alt="" fill sizes="80px" className="object-cover" />}
            </button>
          ))}
        </div>
        </div>
      )}

      <ProductLightbox
        open={lightboxOpen}
        images={images}
        alts={images.map((_, i) => altFor(i))}
        index={active}
        onIndexChange={(i) => goTo(i, false)}
        onClose={() => setLightboxOpen(false)}
        returnFocusRef={expandRef}
      />
    </div>
  );
}
