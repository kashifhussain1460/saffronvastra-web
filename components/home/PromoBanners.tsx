import React from "react";
import Image from "next/image";
import Link from "next/link";
import Carousel from "./Carousel";
import { CONTAINER } from "./SectionHeading";

// Modave paired collection banners ("Capsule Collection" / "New Arrival"): two rounded 3:2 image
// cards with centred text and an underlined link; one per view on phones. Existing shop copy.
const BANNERS = [
  {
    title: "Shop by Collection",
    text: "Thoughtfully curated pieces for every mood, season, and moment.",
    cta: "View All",
    href: "/collections",
    img: "/images/hero/velvet_hero_model.jpg",
    alt: "Model in a maroon embroidered velvet jacket",
    // the photo has a decorative arch cut into its top-left corner; zoom past it
    crop: "origin-bottom-right scale-[1.18] group-hover:scale-[1.24]",
  },
  {
    title: "Premium Fabrics",
    text: "Luxurious fabrics chosen for comfort, drape, and enduring life.",
    cta: "Our Story",
    href: "/about",
    img: "/images/editorial/notifications_right_embroidery.jpg",
    alt: "Close-up of floral embroidery on deep red velvet",
    crop: "origin-bottom-right scale-[1.2] group-hover:scale-[1.26]",
  },
];

export default function PromoBanners() {
  return (
    <section aria-label="Collections" className="bg-canvas">
      <div className={CONTAINER}>
        <Carousel
          label="Collections"
          gapClassName="gap-[15px]"
          slideClassName="basis-full md:basis-[calc((100%-15px)/2)]"
          dotsClassName="md:hidden"
        >
          {BANNERS.map((b) => (
            <div key={b.title} className="group relative aspect-[3/2] overflow-hidden rounded-[20px] bg-surface-muted">
              <Image
                src={b.img}
                alt={b.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover transition-transform duration-1000 ease-out ${b.crop}`}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-inverse/35" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-[15px] text-center xl:gap-3">
                <h2 className="text-[28px] font-medium leading-9 text-on-inverse md:text-[30px] md:leading-[38px] xl:text-[40px] xl:leading-[48px]">
                  {b.title}
                </h2>
                <p className="text-base leading-[26px] text-on-inverse">{b.text}</p>
                <Link
                  href={b.href}
                  className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-on-inverse xl:text-base"
                >
                  <span className="border-b border-on-inverse pb-0.5 transition-colors group-hover:border-transparent">
                    {b.cta}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
