"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCatalogNav } from "@/components/layout/useCatalogNav";
import { CategoryGridSkeleton } from "@/components/ui/Skeleton";

interface CollectionCardData {
  title: string;
  slug: string;
  description: string;
  cta: string;
  image: string;
  badge?: string;
}

const DEFAULT_COLLECTIONS: CollectionCardData[] = [
  {
    title: "Suzani Jackets",
    slug: "suzani-jackets",
    description: "Make a statement with expressive Suzani embroidery and thoughtfully styled jacket silhouettes.",
    cta: "Explore Jackets",
    image: "/images/categories/suzani-jackets.jpg",
    badge: "Statement Silhouettes",
  },
  {
    title: "Suzani Kimonos",
    slug: "suzani-kimonos",
    description: "Discover distinctive kimono silhouettes featuring the character and artistry of Suzani needlework.",
    cta: "Explore Kimonos",
    image: "/images/categories/suzani-kimonos.jpg",
    badge: "Flowing Drape",
  },
];

export default function DynamicCollections() {
  const { allFlatCategories } = useCatalogNav(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map dynamic backend counts and images if available
  const collections: CollectionCardData[] = DEFAULT_COLLECTIONS.map((def) => {
    const match = allFlatCategories.find(
      (c) => c.slug === def.slug || c.name.toLowerCase() === def.title.toLowerCase()
    );
    if (!match) return def;

    return {
      ...def,
      image: match.image || def.image,
      badge: match.count && match.count > 0 ? `${match.count} Designs` : def.badge,
    };
  });

  if (!mounted) {
    return <CategoryGridSkeleton />;
  }

  return (
    <section aria-labelledby="suzani-collections-title" className="py-20 lg:py-28 bg-[#FAF8F5]">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Editorial Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-[0.22em] font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suzani Stitchwork</span>
          </div>

          <h2
            id="suzani-collections-title"
            className="font-heading font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight"
          >
            Curated Suzani Collections
          </h2>

          <p className="mt-4 text-base sm:text-lg text-ink-secondary leading-relaxed font-sans">
            Explore distinctive jacket and kimono silhouettes featuring the character, expressive motifs, and artistry of Suzani needlework.
          </p>
        </div>

        {/* 2-Card Focused Suzani Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {collections.map((cat) => {
            return (
              <article
                key={cat.slug}
                className="group relative flex flex-col rounded-3xl overflow-hidden bg-white border border-line shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300"
              >
                {/* Collection Photography Container */}
                <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden bg-surface-muted">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle Gradient Overlays */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent"
                    aria-hidden="true"
                  />

                  {/* Top Badge */}
                  {cat.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold uppercase tracking-wider text-ink shadow-sm">
                        {cat.badge}
                      </span>
                    </div>
                  )}

                  {/* Image Bottom Information */}
                  <div className="absolute bottom-6 inset-x-6 z-10 text-white">
                    <h3 className="font-heading font-serif text-2xl sm:text-3xl font-medium text-white leading-tight">
                      {cat.title}
                    </h3>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-sm sm:text-base text-ink-secondary leading-relaxed mb-6 font-sans">
                      {cat.description}
                    </p>
                  </div>

                  {/* Primary Collection Button */}
                  <div>
                    <Link
                      href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                      className="inline-flex items-center justify-between w-full h-12 px-6 rounded-full bg-surface-muted text-ink font-semibold text-sm hover:bg-primary hover:text-on-primary transition-colors duration-200 group/btn"
                    >
                      <span>{cat.cta}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>

              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
