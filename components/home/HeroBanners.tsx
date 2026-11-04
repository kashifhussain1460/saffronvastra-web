"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Scissors, Play, Pause } from "lucide-react";
import { BRAND } from "@/lib/brand";

const ATELIER_PILLARS = [
  {
    icon: Sparkles,
    label: "Expressive Needlework",
    detail: "Distinctive Suzani Stitchwork",
  },
  {
    icon: Scissors,
    label: "Made-to-Order Sizing",
    detail: "Tailored to your measurements",
  },
  {
    icon: Truck,
    label: "Direct Workshop Dispatch",
    detail: "Doorstep delivery with live tracking",
  },
  {
    icon: ShieldCheck,
    label: "Authentic Craftsmanship",
    detail: "Zero synthetic prints or shortcuts",
  },
];

export default function HeroBanners() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlRef = useRef<HTMLButtonElement | null>(null);
  // Set once the visitor pauses with the control; every automatic play path respects it.
  const userPausedRef = useRef(false);
  // Automatic playback is only allowed after the poster has painted.
  const autoPlayReadyRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    // Never start motion automatically for reduced motion or Save-Data visitors.
    const autoPlayBlocked = () => Boolean(reducedMotion?.matches || connection?.saveData);

    const playVideo = () => {
      const v = videoRef.current;
      if (!v || !autoPlayReadyRef.current || userPausedRef.current || autoPlayBlocked()) return;
      if (!v.paused) return;
      v.defaultMuted = true;
      v.muted = true;
      const promise = v.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Browser autoplay policy might require a first user gesture
        });
      }
    };

    // 1. Start after the poster has painted, once the main thread is idle
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const startAfterPaint = () => {
      autoPlayReadyRef.current = true;
      playVideo();
    };
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(startAfterPaint, { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(startAfterPaint, 200);
    }

    // 2. Fallback: kickstart playback on the first scroll, touch or pointer interaction.
    // Presses on the control itself are left to togglePlayback.
    const handleGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && controlRef.current?.contains(target)) return;
      if (!autoPlayReadyRef.current) return;
      playVideo();
      detachGestures();
    };

    const detachGestures = () => {
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("scroll", handleGesture);
    };

    window.addEventListener("pointerdown", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });
    window.addEventListener("scroll", handleGesture, { passive: true });

    // 3. Resume when the tab comes back into the foreground
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        playVideo();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 4. Play whenever the hero is back in the viewport
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playVideo();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }

    // 5. Stop motion if the visitor turns on reduced motion while on the page
    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) {
        videoRef.current?.pause();
      }
    };
    reducedMotion?.addEventListener?.("change", handleMotionPreference);

    return () => {
      if (idleHandle !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      detachGestures();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (observer) {
        observer.disconnect();
      }
      reducedMotion?.removeEventListener?.("change", handleMotionPreference);
    };
  }, []);

  const togglePlayback = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPausedRef.current = false;
      v.defaultMuted = true;
      v.muted = true;
      v.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      v.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section ref={containerRef} aria-label="Hero Editorial Banner" className="relative bg-[#1A1817] text-white overflow-hidden">
      
      {/* Background Hero Photography & Ambient Video Loop */}
      <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Static High-Res Poster Image for instant LCP */}
          <Image
            src="/images/hero/suzani_hero_poster.jpg"
            alt="Saffron Vastra Suzani embroidered jacket handcrafted needlework"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-[center_35%] filter brightness-[0.85]"
          />

          {/* Ambient Fashion Video Loop — started after first paint, never for reduced motion or Save-Data */}
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/hero/suzani_hero_poster.jpg"
            onCanPlay={() => setVideoLoaded(true)}
            onLoadedData={() => setVideoLoaded(true)}
            onPlay={() => {
              setVideoLoaded(true);
              setIsPlaying(true);
            }}
            onPlaying={() => {
              setVideoLoaded(true);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            className={`absolute inset-0 w-full h-full object-cover object-[center_35%] filter brightness-[0.88] transition-opacity duration-700 ${
              videoLoaded ? "opacity-100" : "opacity-90"
            }`}
            aria-hidden="true"
          >
            <source src="/videos/hero/suzani-embroidery-loop.mp4" type="video/mp4" />
          </video>

          {/* Multi-stage Luxury Vignette Gradients */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#141211] via-[#141211]/50 to-[#141211]/30"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#141211]/90 via-[#141211]/50 to-transparent"
            aria-hidden="true"
          />

          {/* Discreet Media Controls (WCAG 2.2.2 compliance) */}
          <button
            ref={controlRef}
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause motion" : "Play motion"}
            className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white text-xs font-sans transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Motion</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Motion</span>
              </>
            )}
          </button>
        </div>

        {/* Hero Editorial Content */}
        <div className="relative z-10 mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-2xl lg:max-w-3xl">
            
            {/* Atelier Crest Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 text-accent-cream text-xs uppercase tracking-[0.22em] font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Suzani Needlework</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="font-heading font-serif text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-normal leading-[1.1] tracking-tight text-white">
              The Art of Suzani. <br />
              <span className="italic font-light text-[#F6DFC1]">
                Reimagined for Today.
              </span>
            </h1>

            {/* Brand Supporting Narrative */}
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-white/85 leading-relaxed font-sans max-w-2xl font-light">
              Discover our curated collection of Suzani embroidered jackets and kimonos, where expressive traditional needlework meets contemporary style.
            </p>

            {/* Clear Call to Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/collections?category=suzani-jackets"
                className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-8 rounded-full bg-primary text-on-primary text-sm sm:text-base font-semibold tracking-wide uppercase shadow-[0_4px_20px_rgba(217,119,36,0.35)] hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Explore Suzani Jackets</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/collections?category=suzani-kimonos"
                className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-8 rounded-full bg-white/10 backdrop-blur-md border border-white/30 text-white text-sm sm:text-base font-semibold tracking-wide uppercase hover:bg-white/20 hover:border-white/50 active:scale-[0.98] transition-all"
              >
                <span>Discover Suzani Kimonos</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Atelier Trust Ribbon */}
      <div className="relative z-10 border-t border-white/10 bg-[#141211]/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {ATELIER_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="flex items-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 shrink-0 grid place-items-center text-primary">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold tracking-wide text-white truncate">
                      {pillar.label}
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/60 truncate">
                      {pillar.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
}
