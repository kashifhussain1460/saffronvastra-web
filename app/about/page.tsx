import { BRAND } from "@/lib/brand";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, HeartHandshake, Leaf, Scissors } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";
import Tabs from "@/components/content/Tabs";

export const metadata = {
  title: `Our Story & Atelier Craftsmanship | ${BRAND.name}`,
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
    desc: "Our Jaipur atelier specializes in authentic Zari, Aari, and Marodi needlework. Each bespoke piece requires between 20 to 45 hours of dedicated handcraft by master karigars.",
  },
  {
    icon: HeartHandshake,
    title: "Dignified Artisan Collective",
    desc: "We work directly with third-generation master craftspeople in Rajasthan, guaranteeing fair living wages, safe and sunlit atelier environments, and health security for their families.",
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
    title: "Bespoke Cut & Silk Lining",
    desc: "The embroidered panels are cut to your custom measurements and lined with breathable pure silk crepe, tailored to feel as heavenly inside as it looks outside.",
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
      <PageTitle title="About Our Atelier" crumbs={[{ label: "Home", href: "/" }, { label: "Our Story" }]} />

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
              Jaipur Atelier: Master Karigar Salim Khan drafting Zardozi vines on midnight silk velvet.
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
                        {BRAND.name} was founded to honor the sacred, slow craft of generational Indian needlework. We construct each bespoke jacket, kimono, and ensemble entirely made-to-order in Jaipur, Rajasthan.
                      </p>
                      <p>
                        For centuries, the royal ateliers of Rajasthan nurtured artisans who transformed silk, gold wire, and pearls into wearable poems. As modern fast fashion accelerated, these painstaking arts began to disappear under the weight of mechanized mass production.
                      </p>
                    </>
                  ),
                },
                {
                  id: "rooted",
                  label: "Rooted in Rajasthan",
                  content: (
                    <p>
                      {BRAND.name} was born from an unwavering rebellion against the ephemeral. We chose not to participate in seasonal markdowns, overstuffed warehouses, or disposable garments. Instead, we established a quiet, dignified atelier in the historic heart of Jaipur where patience is celebrated as the greatest luxury.
                    </p>
                  ),
                },
                {
                  id: "commission",
                  label: "Your Commission",
                  content: (
                    <p>
                      When you order a piece from {BRAND.name}, you are not merely purchasing clothing. You are directly commissioning an artisan to dedicate days of skilled needlework to your name, creating an heirloom intended to be cherished for decades.
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
                Speak to Atelier Concierge
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
            <h2 className={sectionHeading}>The Journey of a Bespoke Creation</h2>
            <p className="mt-3 text-base leading-[26px] text-ink-secondary">
              From the moment your commission is confirmed, here is how master artisans bring your garment into existence over 5 to 7 days.
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
              Our atelier family includes over forty master artisans, pattern drafters, and hand-finishers in Jaipur. Many learned their craft at the knees of their grandparents, inheriting instinctive mastery over gold thread tension, knotting, and botanical shading.
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
