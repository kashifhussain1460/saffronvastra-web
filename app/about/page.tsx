import { BRAND } from "@/lib/brand";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, HeartHandshake, Leaf, Scissors } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";
import Tabs from "@/components/content/Tabs";

export const metadata = {
  title: `Our Story & Jaipur Craftsmanship | ${BRAND.name}`,
  description:
    `Discover the heritage, master artisans, and made-to-order slow fashion philosophy behind ${BRAND.name} in Jaipur, India.`,
};

const pillars = [
  {
    icon: Scissors,
    title: "Made to Order, Never Mass Produced",
    desc: "We hold zero warehouse deadstock. Every garment is drafted, hand-cut, and meticulously assembled only after your order is placed, completely eliminating the waste of mass fashion.",
  },
  {
    icon: Sparkles,
    title: "Generational Heritage Embroidery",
    desc: "Our Jaipur workshop specializes in authentic Zari, Aari, and Marodi needlework. Each handcrafted piece requires between 20 to 45 hours of dedicated handcraft by master artisans.",
  },
  {
    icon: HeartHandshake,
    title: "Dignified Artisan Collective",
    desc: "We work directly with third-generation master craftspeople in Rajasthan, guaranteeing fair wages, safe workshop environments, and long-term security for their families.",
  },
  {
    icon: Leaf,
    title: "Conscious Material Sourcing",
    desc: "From pure mulberry silk velvet and organic handspun cottons to azo-free dyes and recycled metallic zari threads, every raw textile is chosen for its heirloom longevity.",
  },
];

const steps = [
  {
    number: "01",
    title: "Design & Pattern Drafting",
    desc: "Each silhouette is architected in our Jaipur design studio, harmonizing traditional Rajasthani silhouettes with modern tailoring and fluid draping.",
  },
  {
    number: "02",
    title: "Karchob Loom Framing",
    desc: "Lustrous mulberry silk velvet is tautly mounted onto wooden Karchob frames, allowing artisans to execute micro-needle tension with absolute precision.",
  },
  {
    number: "03",
    title: "Heirloom Zari Needlework",
    desc: "Master artisans apply metallic threads, beads, and delicate sequins stitch-by-stitch, bringing intricate botanical and Mughal-inspired motifs to life.",
  },
  {
    number: "04",
    title: "Custom Cut & Silk Lining",
    desc: "The embroidered panels are cut to your selected measurements and lined with breathable pure silk crepe, tailored to feel comfortable and luxurious inside and out.",
  },
  {
    number: "05",
    title: "White-Glove Inspection & Gift Box",
    desc: `Every creation undergoes 14 distinct quality checkpoints before being folded into a custom scented muslin bag and botanical ${BRAND.name} keepsake box.`,
  },
];

const sustainability = [
  {
    title: "Zero Fabric Scraps Wasted",
    desc: "All excess silk velvet and handloom remnants from tailoring are gathered and fashioned into potli bags, jewelry pouches, and hair accessories.",
  },
  {
    title: "Botanical & Azo-Free Dyes",
    desc: "Our rich palette of terracotta, deep saffron, teal, and wine is achieved using skin-safe, certified azo-free colorants that protect local water bodies.",
  },
  {
    title: "Plastic-Free Keepsake Packaging",
    desc: "Every shipment is nestled inside unbleached organic cotton muslin preservation bags and recycled rigid gift boxes designed for lifelong storage.",
  },
];

const container = "max-w-[1320px] mx-auto px-4 lg:px-[15px]";
const sectionHeading = "text-[28px] leading-9 md:text-[40px] md:leading-[48px] font-medium text-ink";
const btnPrimary =
  "inline-flex items-center justify-center h-12 md:h-[58px] px-6 md:px-8 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors";
const btnOutline =
  "inline-flex items-center justify-center h-12 md:h-[58px] px-6 md:px-8 rounded-full border border-ink text-ink text-sm md:text-base font-semibold hover:bg-primary hover:text-on-primary transition-colors";

export default function AboutPage() {
  return (
    <div className="bg-canvas text-ink">
      <PageTitle title="About Our Workshop & Craft" crumbs={[{ label: "Home", href: "/" }, { label: "Our Story" }]} />

      {/* Story: image + tabs */}
      <section className="pt-10 md:pt-20">
        <div className={`${container} grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[60px] items-center`}>
          <figure className="min-w-0">
            <div className="relative aspect-[620/412] rounded-xl overflow-hidden bg-surface-muted">
              <Image
                src="/images/editorial/artisan_embroidery.jpg"
                alt="Master Artisan Embroidering Velvet"
                fill
                priority
                sizes="(min-width: 1024px) 620px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-ink-muted">
              Jaipur Workshop: Master Artisan drafting hand embroidery patterns on velvet.
            </figcaption>
          </figure>

          <div className="min-w-0">
            <h2 className={`${sectionHeading} mb-5`}>Wear Stories, Not Trends.</h2>
            <Tabs
              label="Our story"
              tabs={[
                {
                  id: "introduction",
                  label: "Introduction",
                  content: (
                    <>
                      <p>
                        {BRAND.name} was founded to honor the rich tradition of Indian hand embroidery. We craft each jacket, kimono, and piece made-to-order in Jaipur, Rajasthan.
                      </p>
                      <p>
                        For centuries, the royal workshops of Rajasthan nurtured artisans who transformed silk, fabrics, and fine thread into wearable art. We are committed to preserving these time-honored skills with contemporary styling.
                      </p>
                    </>
                  ),
                },
                {
                  id: "rooted",
                  label: "Rooted in Rajasthan",
                  content: (
                    <p>
                      {BRAND.name} believes in thoughtful, conscious fashion. We choose not to overproduce or hold excess warehouse stock. Instead, our Jaipur workshop creates pieces with patience, pride, and quality that lasts.
                    </p>
                  ),
                },
                {
                  id: "commission",
                  label: "Your Order",
                  content: (
                    <p>
                      When you order from {BRAND.name}, you are directly supporting skilled local artisans who spend days carefully handcrafting your clothing. Each piece is made to be worn, loved, and kept for years.
                    </p>
                  ),
                },
              ]}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collections" className={btnPrimary}>
                Explore The Collections
              </Link>
              <Link href="/contact" className={btnOutline}>
                Contact Customer Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Four pillars as Modave icon boxes */}
      <section className="py-10 md:py-20">
        <div className={container}>
          <h2 className="sr-only">The Four Pillars of Saffron Luxury</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-[30px] pb-10 md:pb-20 border-b border-line">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li key={pillar.title} className="flex items-start gap-3">
                  <span className="w-16 h-16 shrink-0 rounded-full border border-line flex items-center justify-center text-ink">
                    <Icon aria-hidden="true" className="w-7 h-7" strokeWidth={1.25} />
                  </span>
                  <div>
                    <h3 className="text-lg leading-6 md:text-xl md:leading-7 font-medium text-ink mb-1.5">{pillar.title}</h3>
                    <p className="text-sm leading-[22px] text-ink-secondary">{pillar.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="pb-10 md:pb-20">
        <div className={container}>
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            <h2 className={sectionHeading}>How Your Garment Is Made</h2>
            <p className="mt-3 text-base leading-[26px] text-ink-secondary">
              From the moment your order is placed, here is how our master artisans craft your garment step by step over 5 to 7 days.
            </p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-[30px]">
            {steps.map((step) => (
              <li key={step.number} className="rounded-2xl border border-line p-6 space-y-3">
                <span className="block text-[30px] leading-[42px] font-medium text-ink-muted">{step.number}</span>
                <h3 className="text-lg leading-6 font-medium text-ink">{step.title}</h3>
                <p className="text-sm leading-[22px] text-ink-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Artisans */}
      <section id="artisans" className="scroll-mt-24 py-10 md:py-20 bg-surface-muted">
        <div className={`${container} grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[60px] items-center`}>
          <div className="min-w-0 space-y-5">
            <h2 className={sectionHeading}>Hands That Breathe Soul Into Silk</h2>
            <p className="text-base leading-[26px] text-ink-secondary">
              Our workshop team includes over forty master artisans, pattern makers, and tailors in Jaipur. Many learned their craft at the knees of their grandparents, inheriting instinctive mastery over needlework, tension, knotting, and botanical shading.
            </p>
            <blockquote className="border-l-2 border-ink pl-4 py-1">
              <p className="text-lg leading-7 text-ink">
                &ldquo;When a garment is rushed, it carries haste. When it is embroidered with patience and pride, it carries grace for a lifetime.&rdquo;
              </p>
              <footer className="mt-2 text-sm text-ink-muted">— Ustad Rahmatullah, Senior Zardozi Master (34 Years of Craft)</footer>
            </blockquote>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden min-w-0">
            <Image
              src="/images/editorial/notifications_right_embroidery.jpg"
              alt="Intricate Zari Hand Stitching"
              fill
              sizes="(min-width: 1024px) 620px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section id="sustainability" className="scroll-mt-24 py-10 md:py-20">
        <div className={container}>
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
            <h2 className={sectionHeading}>Sustainability Through Intentionality</h2>
            <p className="mt-3 text-base leading-[26px] text-ink-secondary">
              True sustainability begins by ending overproduction. Conventional fashion brands manufacture thousands of units in advance, burning or discounting unsold garments. {BRAND.name} operates exclusively on demand:
            </p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-[30px]">
            {sustainability.map((s) => (
              <li key={s.title} className="rounded-2xl bg-surface-muted p-6 space-y-2">
                <h3 className="text-lg leading-6 md:text-xl md:leading-7 font-medium text-ink">{s.title}</h3>
                <p className="text-sm leading-[22px] text-ink-secondary">{s.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
