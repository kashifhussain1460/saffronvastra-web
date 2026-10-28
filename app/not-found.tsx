import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  const quickLinks = [
    { title: "Shop the collection", desc: "Hand-embroidered velvet and cotton jackets, made to order", href: "/collections" },
    { title: "The Journal", desc: "Stories from the Jaipur atelier and the people behind each piece", href: "/journal" },
    { title: "Need help?", desc: "Write to us and we will help you find what you were looking for", href: "/contact" },
  ];

  return (
    <section className="bg-canvas text-ink py-10 md:py-20">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 items-center gap-8 md:gap-10 lg:gap-0">
        <div className="lg:col-span-6 relative aspect-[4/3] md:aspect-square lg:aspect-[679/600] rounded-2xl overflow-hidden bg-surface-muted">
          <Image
            src="/images/editorial/artisan_embroidery.jpg"
            alt="An artisan embroidering silk velvet in our Jaipur atelier"
            fill
            sizes="(min-width: 1024px) 680px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="lg:col-start-8 lg:col-span-5 text-center md:text-left">
          <p aria-hidden="true" className="font-medium text-ink leading-none text-[88px] sm:text-[120px] lg:text-[160px] tracking-tight">
            Oops!
          </p>
          <p className="mt-4 md:mt-6 text-sm font-medium text-ink-muted">Error 404 &bull; Page not found</p>
          <h1 className="mt-1 text-[30px] leading-9 lg:text-[44px] lg:leading-[50px] font-medium text-ink">The Piece Has Wandered.</h1>
          <p className="mt-2 text-base md:text-lg leading-7 text-ink-secondary">
            The bespoke creation or editorial story you are seeking might have been archived, renamed, or is currently on the loom. Allow us to guide you back to our atelier.
          </p>
          <div className="mt-6 md:mt-8 flex flex-wrap justify-center md:justify-start gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 md:h-[58px] px-6 md:px-8 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors"
            >
              Back To Homepage
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center h-12 md:h-[58px] px-6 md:px-8 rounded-full border border-ink text-ink text-sm md:text-base font-semibold hover:bg-primary hover:text-on-primary transition-colors"
            >
              Explore All Collections
            </Link>
          </div>

          <ul className="mt-8 md:mt-10 border-t border-line divide-y divide-line text-left">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block text-base font-medium text-ink group-hover:text-primary-hover transition-colors">{item.title}</span>
                    <span className="block text-sm text-ink-secondary">{item.desc}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="w-4 h-4 shrink-0 text-ink transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
