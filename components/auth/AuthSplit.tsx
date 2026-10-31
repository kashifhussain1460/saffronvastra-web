import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Flower2, Leaf, Gem, ShieldCheck, ArrowRight } from "lucide-react";
import type { Crumb } from "@/components/checkout/PageTitle";
import Logo from "@/components/brand/Logo";

export interface AuthSplitProps {
  title: string;
  crumbs: Crumb[];
  aside?: { heading: string; text: React.ReactNode; href: string; cta: string };
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  heroHeading?: React.ReactNode;
  heroSubtitle?: string;
  showRightLogo?: boolean;
}

export default function AuthSplit({
  title,
  crumbs,
  aside,
  children,
  imageSrc = "/images/auth/heritage_courtyard_embroidery.webp",
  imageAlt = "Saffron Vastra luxury hand-embroidered couture in heritage courtyard",
  heroHeading,
  heroSubtitle = "Explore timeless embroidery and contemporary silhouettes, thoughtfully brought together.",
  showRightLogo = true,
}: AuthSplitProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 selection:bg-accent/30 flex flex-col justify-center">
      {/* Desktop: Split Screen (approx 70% Left Editorial Photography / 30% Right Form Panel) */}
      {/* Mobile & Tablet (<1024px): Background image completely hidden, centered luxury full-width card layout */}
      <div className="min-h-screen w-full flex flex-col justify-center lg:grid lg:grid-cols-[68%_32%] xl:grid-cols-[70%_30%] lg:h-screen lg:overflow-hidden">
        
        {/* Left Section: 68-70% Editorial Fashion Photography & Brand Storytelling (Desktop only: hidden on mobile & tablet) */}
        <section
          aria-label="Atelier Heritage & Craftsmanship"
          className="hidden lg:flex relative lg:min-h-full flex-col justify-between p-10 lg:p-12 xl:p-16 overflow-hidden text-white"
        >
          {/* Full Coverage Background Editorial Fashion Photograph */}
          <div className="absolute inset-0 z-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover filter brightness-[0.96]"
              style={{ objectPosition: "72% center" }}
            />
            {/* Subtle Vignette & Scrim Gradients for text contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/35 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Top spacer */}
          <div className="relative z-10 h-6 sm:h-8" aria-hidden="true" />

          {/* Center / Lower-Left Editorial Storytelling with generous line-height and spacing */}
          <div className="relative z-10 my-auto py-6 lg:py-10 max-w-lg">
            {heroHeading || (
              <div className="space-y-2 lg:space-y-3">
                <div className="font-heading text-3xl lg:text-[46px] xl:text-[54px] text-white font-medium leading-[1.2] tracking-normal drop-shadow-md">
                  Crafted by
                  <br />
                  Tradition.
                </div>
                <div className="font-heading text-3xl lg:text-[46px] xl:text-[54px] text-white italic font-medium leading-[1.2] tracking-normal drop-shadow-md">
                  Designed
                  <br />
                  for Today.
                </div>
              </div>
            )}

            <p className="mt-5 lg:mt-7 text-sm lg:text-[15px] text-white/90 font-light max-w-md leading-relaxed drop-shadow-sm font-sans">
              {heroSubtitle}
            </p>
          </div>

          {/* Bottom 3 Feature Items */}
          <div className="relative z-10 pt-4 flex flex-wrap items-end gap-x-10 lg:gap-x-12 xl:gap-x-14 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <Flower2 className="w-5 h-5 text-white stroke-[1.25]" aria-hidden="true" />
              <span className="text-xs text-white/90 font-light leading-snug drop-shadow-xs font-sans">
                Authentic
                <br />
                Craftsmanship
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Leaf className="w-5 h-5 text-white stroke-[1.25]" aria-hidden="true" />
              <span className="text-xs text-white/90 font-light leading-snug drop-shadow-xs font-sans">
                Sustainable
                <br />
                Fashion
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Gem className="w-5 h-5 text-white stroke-[1.25]" aria-hidden="true" />
              <span className="text-xs text-white/90 font-light leading-snug drop-shadow-xs font-sans">
                Thoughtfully
                <br />
                Curated Collections
              </span>
            </div>
          </div>
        </section>

        {/* Right Section: Form Panel */}
        {/* Desktop: 30-32% column, scrollable, vertically centered */}
        {/* Mobile & Tablet: full width, centered container on warm cream canvas */}
        <section
          aria-label={title}
          className="w-full flex-1 flex flex-col justify-center items-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:relative lg:bg-[#FAF9F5] lg:h-full lg:overflow-y-auto lg:border-l lg:border-stone-200/80 lg:py-10 lg:px-10 xl:px-14"
        >
          <div className="w-full max-w-[460px] mx-auto bg-white/95 sm:bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-9 md:p-10 lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0 flex flex-col justify-center">
            
            {/* Top Brand Logo - Centered horizontally */}
            {showRightLogo && (
              <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center text-center">
                <Logo kind="auth" size="md" priority className="inline-flex" />
              </div>
            )}

            {/* Breadcrumb Navigation - only rendered if crumbs array is populated */}
            {crumbs && crumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="mb-5 sm:mb-6 flex justify-center">
                <ol className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase text-stone-400 font-sans">
                  {crumbs.map((c, i) => {
                    const last = i === crumbs.length - 1;
                    return (
                      <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                        {c.href && !last ? (
                          <Link href={c.href} className="hover:text-stone-900 transition-colors">
                            {c.label}
                          </Link>
                        ) : (
                          <span className="text-stone-900 font-bold" aria-current={last ? "page" : undefined}>
                            {c.label}
                          </span>
                        )}
                        {!last && <span className="text-stone-300 font-normal mx-0.5" aria-hidden="true">&gt;</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {/* Form Slot */}
            <div className="w-full">
              {children}
            </div>

            {/* Aside / Alternate Action Toggle (e.g. New Customer Card) */}
            {aside && (
              <>
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative bg-[#FBFBFA] lg:bg-[#FAF9F5] px-4 text-[11px] uppercase tracking-widest text-stone-400 font-medium font-sans">
                    OR
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200/90 bg-[#FBFBFA] p-5 sm:p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <h2 className="text-sm font-semibold text-stone-900 font-sans">
                    {aside.heading}
                  </h2>
                  <div className="mt-1.5 text-xs text-stone-500 leading-relaxed px-2 font-sans">
                    {aside.text}
                  </div>
                  <Link
                    href={aside.href}
                    className="mt-4 inline-flex items-center justify-center w-full h-10 px-5 rounded-full border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:border-stone-900 hover:text-stone-950 transition-colors shadow-xs gap-1.5 group cursor-pointer font-sans"
                  >
                    <span>{aside.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </>
            )}

            {/* Security Trust Footer */}
            <div className="mt-7 flex items-center justify-center gap-1.5 text-xs text-stone-500 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Protected by 256-Bit SSL Encryption</span>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
