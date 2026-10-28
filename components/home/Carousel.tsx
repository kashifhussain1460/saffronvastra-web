"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Small scroll-snap carousel (Modave "swiper" look) with no dependency:
// swipe/trackpad scrolling, prev/next buttons, dot pagination and arrow-key support.
// Pagination is derived from the real overflow, so a track that fits shows no controls.

interface CarouselProps {
  /** Accessible name of the carousel region, e.g. "Best sellers". */
  label: string;
  children: React.ReactNode[];
  /** Width of each slide per breakpoint, e.g. "basis-full md:basis-1/2". */
  slideClassName: string;
  /** Gap between slides per breakpoint, e.g. "gap-[15px] lg:gap-[30px]". */
  gapClassName: string;
  /** Extra classes for individual slides by index (e.g. a hero tile spanning two grid rows). */
  slideClasses?: string[];
  /** Extra classes for the track (e.g. turning it into a grid from md up). */
  trackClassName?: string;
  /** Where the prev/next buttons show; Modave shows them on large screens only. */
  arrowsClassName?: string;
  /** Vertical position of the arrows (they sit on the slide images). */
  arrowTopClassName?: string;
  /** Where the dots show; Modave shows them below lg. */
  dotsClassName?: string;
  /** Center the slides when they do not fill the track. */
  centerFew?: boolean;
}

const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export default function Carousel({
  label,
  children,
  slideClassName,
  gapClassName,
  slideClasses = [],
  trackClassName = "",
  arrowsClassName = "hidden lg:flex",
  arrowTopClassName = "top-1/2",
  dotsClassName = "lg:hidden",
  centerFew = false,
}: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const count = children.length;

  // Distance between the starts of two neighbouring slides.
  const stepSize = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length === 0) return 0;
    const first = track.children[0] as HTMLElement;
    const second = track.children[1] as HTMLElement | undefined;
    return second ? Math.abs(second.offsetLeft - first.offsetLeft) || first.offsetWidth : first.offsetWidth;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const overflow = track.scrollWidth - track.clientWidth;
    const step = stepSize();
    if (overflow <= 2 || step === 0) {
      setPages(1);
      setActive(0);
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const perView = Math.max(1, Math.round(track.clientWidth / step));
    const total = Math.max(1, count - perView + 1);
    setPages(total);
    const atEnd = track.scrollLeft >= overflow - 2;
    setActive(atEnd ? total - 1 : Math.min(total - 1, Math.round(track.scrollLeft / step)));
    setCanPrev(track.scrollLeft > 2);
    setCanNext(!atEnd);
  }, [count, stepSize]);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

  const scrollToPage = (page: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: page * stepSize(), behavior: "smooth" });
  };

  const scrollByStep = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * stepSize(), behavior: "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByStep(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByStep(-1);
    }
  };

  const scrollable = pages > 1;
  const arrowBase =
    "absolute z-10 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border transition-colors duration-200";
  const arrowState = (enabled: boolean) =>
    enabled
      ? "border-ink-secondary bg-surface text-ink hover:border-primary hover:bg-primary hover:text-on-primary"
      : "cursor-default border-transparent bg-inverse/20 text-on-inverse";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="relative">
      <ul
        ref={trackRef}
        onScroll={measure}
        onKeyDown={onKeyDown}
        tabIndex={scrollable ? 0 : -1}
        aria-label={scrollable ? `${label}: use the arrow keys to scroll` : undefined}
        className={`flex snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto ${NO_SCROLLBAR} ${gapClassName} ${trackClassName}`}
      >
        {children.map((child, i) => (
          <li
            key={i}
            className={`min-w-0 shrink-0 grow-0 snap-start ${slideClassName} ${slideClasses[i] ?? ""} ${
              centerFew && i === 0 ? "ml-auto" : ""
            } ${centerFew && i === count - 1 ? "mr-auto" : ""}`}
          >
            {child}
          </li>
        ))}
      </ul>

      {scrollable && (
        <>
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            disabled={!canPrev}
            aria-label={`Previous: ${label}`}
            className={`${arrowBase} ${arrowState(canPrev)} ${arrowsClassName} ${arrowTopClassName} -left-[15px]`}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            disabled={!canNext}
            aria-label={`Next: ${label}`}
            className={`${arrowBase} ${arrowState(canNext)} ${arrowsClassName} ${arrowTopClassName} -right-[15px]`}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <div className={`mt-3 flex items-center justify-center ${dotsClassName}`}>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToPage(i)}
                aria-label={`Show slide ${i + 1} of ${pages}: ${label}`}
                aria-current={i === active ? "true" : undefined}
                className="group/dot flex h-11 w-7 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className={`flex items-center justify-center rounded-full border transition-all duration-200 ${
                    i === active ? "h-4 w-4 border-ink" : "h-2 w-2 border-ink group-hover/dot:bg-ink"
                  }`}
                >
                  {i === active && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
