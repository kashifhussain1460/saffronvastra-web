import React from "react";
import { Sparkles, Compass, Layers, CheckCircle } from "lucide-react";
import { CONTAINER } from "./SectionHeading";

const PILLARS = [
  {
    icon: Sparkles,
    title: "Distinctive Suzani Designs",
    description:
      "Expressive traditional needlework featuring bold floral motifs and rich decorative character on every piece.",
  },
  {
    icon: Layers,
    title: "Jackets & Kimono Silhouettes",
    description:
      "Versatile tailoring from structured cropped jackets to easy, flowing wrap kimonos crafted for effortless layering.",
  },
  {
    icon: Compass,
    title: "Detailed Product Presentation",
    description:
      "High-resolution garment photography, clear sizing charts, and transparent material details to help you choose with confidence.",
  },
  {
    icon: CheckCircle,
    title: "Thoughtfully Curated Collection",
    description:
      "A dedicated, focused catalog centered on authentic statement embroidery rather than mass-produced trends.",
  },
];

export default function WhyExplore() {
  return (
    <section aria-labelledby="why-explore-title" className="py-20 lg:py-24 bg-[#FAF8F5] border-t border-line/60">
      <div className={CONTAINER}>
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-[0.22em] font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Saffron Vastra Standard</span>
          </div>
          <h2
            id="why-explore-title"
            className="font-heading font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight"
          >
            Why Explore Saffron Vastra
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-secondary leading-relaxed font-sans">
            A purposeful approach to statement embroidery, focused on design distinction and wearable contemporary silhouettes.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex flex-col items-start p-7 rounded-2xl bg-white border border-line/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-5 shrink-0">
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-heading font-serif text-xl font-medium text-ink mb-2.5">
                  {p.title}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed font-sans font-light">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

