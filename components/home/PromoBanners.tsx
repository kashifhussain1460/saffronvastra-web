import React from "react";
import Image from "next/image";
import Link from "next/link";
import Carousel from "./Carousel";
import { CONTAINER } from "./SectionHeading";

const BANNERS = [
  {
    title: "Suzani Jackets",
    text: "Expressive traditional needlework tailored into statement jacket silhouettes.",
    cta: "Explore Jackets",
    href: "/collections?category=suzani-jackets",
    img: "/images/categories/suzani-jackets.jpg",
    alt: "Saffron Vastra Suzani embroidered jacket",
    crop: "object-center scale-[1.05] group-hover:scale-[1.10]",
  },
  {
    title: "Suzani Kimonos",
    text: "Graceful wrap silhouettes featuring intricate floral and medallion embroidery.",
    cta: "Discover Kimonos",
    href: "/collections?category=suzani-kimonos",
    img: "/images/categories/suzani-kimonos.jpg",
    alt: "Saffron Vastra Suzani embroidered kimono",
    crop: "object-center scale-[1.05] group-hover:scale-[1.10]",
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
              <div aria-hidden="true" className="absolute inset-0 bg-inverse/45" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-[15px] text-center xl:gap-3">
                <h2 className="text-[28px] font-medium leading-9 text-on-inverse md:text-[30px] md:leading-[38px] xl:text-[40px] xl:leading-[48px] font-heading font-serif">
                  {b.title}
                </h2>
                <p className="text-base leading-[26px] text-on-inverse font-sans max-w-md">{b.text}</p>
                <Link
                  href={b.href}
                  className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-on-inverse xl:text-base font-sans"
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
