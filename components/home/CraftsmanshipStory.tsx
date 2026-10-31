"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Award } from "lucide-react";

export default function CraftsmanshipStory() {
  return (
    <section aria-labelledby="craftsmanship-story-title" className="py-20 lg:py-28 bg-white border-t border-line/60">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column — Editorial Craftsmanship Photography */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl bg-surface-muted">
              <Image
                src="/images/categories/suzani-stitchwork.jpg"
                alt="Detailed Suzani embroidery featuring intricate decorative needlework"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent"
                aria-hidden="true"
              />
            </div>

            {/* Floating Atelier Badge */}
            <div className="absolute -bottom-6 -right-2 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-line shadow-xl max-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Award className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <p className="font-serif font-bold text-sm text-ink leading-tight">
                    Artisanal Suzani Stitchwork
                  </p>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Distinctive needlework translated for modern styling.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Editorial Storytelling Narrative */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-[0.22em] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Suzani Craftsmanship & Silhouettes</span>
            </div>

            <h2
              id="craftsmanship-story-title"
              className="font-heading font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.15]"
            >
              A Tradition Woven Into Every Detail
            </h2>

            <p className="mt-5 text-base sm:text-lg text-ink-secondary leading-relaxed font-sans font-light">
              Suzani is celebrated for its expressive embroidered motifs and decorative character. At Saffron Vastra, our collection brings this distinctive craft into contemporary jacket and kimono silhouettes.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-surface-muted text-primary grid place-items-center shrink-0 font-serif font-bold text-sm border border-line">
                  I
                </div>
                <div>
                  <h4 className="font-heading font-serif text-lg font-semibold text-ink">
                    Expressive Floral Motifs
                  </h4>
                  <p className="text-sm text-ink-secondary mt-1 leading-normal font-sans">
                    Richly patterned botanical and medallion motifs inspired by centuries of decorative textile artistry.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-surface-muted text-primary grid place-items-center shrink-0 font-serif font-bold text-sm border border-line">
                  II
                </div>
                <div>
                  <h4 className="font-heading font-serif text-lg font-semibold text-ink">
                    Structured & Fluid Silhouettes
                  </h4>
                  <p className="text-sm text-ink-secondary mt-1 leading-normal font-sans">
                    Tailored cropped jackets and flowing kimonos designed for effortless everyday layering and statement looks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-surface-muted text-primary grid place-items-center shrink-0 font-serif font-bold text-sm border border-line">
                  III
                </div>
                <div>
                  <h4 className="font-heading font-serif text-lg font-semibold text-ink">
                    Thoughtfully Selected Fabrics
                  </h4>
                  <p className="text-sm text-ink-secondary mt-1 leading-normal font-sans">
                    Quality cottons and durable canvases chosen to hold bold embroidery while offering enduring drape and comfort.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-ink text-white text-sm font-semibold hover:bg-primary transition-colors"
              >
                <span>Explore the Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full border border-line text-ink text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                <span>Our Brand Story</span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
