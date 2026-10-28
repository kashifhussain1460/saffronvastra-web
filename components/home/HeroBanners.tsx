import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Carousel from "./Carousel";
import { CONTAINER } from "./SectionHeading";

// Modave hero: one tall card and two stacked cards (2-column grid from md up),
// a one-card-per-view swipe carousel on phones. Copy and links are the shop's existing hero copy.
const CARDS = [
  {
    title: "Wear Stories of Tradition",
    text: "Embroidered jackets and timeless pieces bringing together heritage craftsmanship and modern living.",
    cta: "Shop Collection",
    href: "/collections",
    img: "/images/hero/hero_model.jpg",
    alt: "Model wearing a hand-embroidered maroon velvet jacket",
    position: "object-[68%_center]",
  },
  {
    title: "Autumn 2026",
    text: "Rich textures, earthy tones, and handcrafted details, made for slower, more meaningful days.",
    cta: "Explore the Lookbook",
    href: "/collections?category=jackets",
    img: "/images/editorial/autumn_lookbook.jpg",
    alt: "Model in an ivory embroidered jacket from the autumn edit",
    position: "object-center",
  },
  {
    title: "Hand Embroidered With Purpose",
    text: "Every creation is made to order by skilled artisans in Rajasthan.",
    cta: "Our Story",
    href: "/about",
    img: "/images/editorial/artisan_embroidery.jpg",
    alt: "Artisan hand embroidering a floral pattern on velvet",
    position: "object-center",
  },
];

export default function HeroBanners() {
  return (
    <section aria-label="Featured" className="bg-canvas">
      <div className={CONTAINER}>
        <Carousel
          label="Featured"
          gapClassName="gap-[15px] xl:gap-[30px]"
          slideClassName="basis-full md:basis-auto"
          slideClasses={["md:row-span-2"]}
          trackClassName="md:grid md:grid-cols-2 md:grid-rows-2 md:overflow-visible"
          dotsClassName="md:hidden"
        >
          {CARDS.map((card, i) => {
            // The first card carries the page's main heading.
            const Heading = i === 0 ? "h1" : "h2";
            return (
            <div
              key={card.title}
              className={`group relative h-full overflow-hidden rounded-[20px] bg-surface-muted aspect-[9/10] ${
                i === 0 ? "md:aspect-[3/4]" : "md:aspect-auto"
              }`}
            >
              <Image
                src={card.img}
                alt={card.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover ${card.position} transition-transform duration-1000 ease-out group-hover:scale-105`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-inverse/70 via-inverse/20 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[30px] p-5 xl:gap-9 xl:p-10">
                <div className="flex flex-col gap-2 xl:gap-3">
                  <Heading className="text-[28px] font-medium leading-9 text-on-inverse md:text-[30px] md:leading-[38px] xl:text-[40px] xl:leading-[48px]">
                    {card.title}
                  </Heading>
                  <p className={`max-w-md text-base leading-[26px] text-on-inverse ${i > 0 ? "md:max-xl:hidden" : ""}`}>{card.text}</p>
                </div>
                <div>
                  <Link
                    href={card.href}
                    className="inline-flex h-[46px] items-center gap-2 rounded bg-surface px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-primary hover:text-on-primary xl:h-14 xl:px-8 xl:text-base"
                  >
                    {card.cta}
                    <ArrowUpRight className="h-[18px] w-[18px] xl:h-[22px] xl:w-[22px]" strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
            );
          })}
        </Carousel>
      </div>
    </section>
  );
}
