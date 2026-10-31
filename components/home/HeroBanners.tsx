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
    label: "Direct Atelier Dispatch",
    detail: "Doorstep tracking with milestones",
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Reliable cross-browser autoplay initiator
  useEffect(() => {
    const playVideo = () => {
      const v = videoRef.current;
      if (!v) return;
      v.defaultMuted = true;
      v.muted = true;
      const promise = v.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
            setVideoLoaded(true);
          })
          .catch(() => {
            // Browser autoplay policy might require first user gesture
          });
      }
    };

    // 1. Immediate attempt on mount
    playVideo();

    // 2. Retry on initial frame/load events
    const v = videoRef.current;
    if (v) {
      v.addEventListener("loadeddata", playVideo);
      v.addEventListener("canplay", playVideo);
      v.addEventListener("canplaythrough", playVideo);
    }

    // 3. Fallback: kickstart playback on any user interaction (scroll, touch, click, pointer)
    const handleGesture = () => {
      playVideo();
      detachGestures();
    };

    const detachGestures = () => {
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("scroll", handleGesture);
      window.removeEventListener("click", handleGesture);
    };

    window.addEventListener("pointerdown", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });
    window.addEventListener("scroll", handleGesture, { passive: true });
    window.addEventListener("click", handleGesture, { passive: true });

    // 4. Resume immediately when tab comes into foreground
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        playVideo();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 5. IntersectionObserver to play whenever hero is in viewport
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

    return () => {
      detachGestures();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (v) {
        v.removeEventListener("loadeddata", playVideo);
        v.removeEventListener("canplay", playVideo);
        v.removeEventListener("canplaythrough", playVideo);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
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

          {/* Ambient Fashion Video Loop — Always Autoplay */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
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
            <source src="/clideo_editor_cca07515185443df8a3b205365a5596d.mp4" type="video/mp4" />
            <source src="/videos/hero/suzani_embroidery_loop.mp4" type="video/mp4" />
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
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause background fashion video" : "Play background fashion video"}
            className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white text-xs font-sans transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
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
              <span>Artisanal Suzani Needlework</span>
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
