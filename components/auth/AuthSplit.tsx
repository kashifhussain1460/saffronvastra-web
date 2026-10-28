import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, PackageCheck, Heart, MapPin } from "lucide-react";
import type { Crumb } from "@/components/checkout/PageTitle";

const perks = [
  { icon: PackageCheck, text: "Follow every order from atelier to doorstep" },
  { icon: Heart, text: "Keep a wishlist of pieces you love" },
  { icon: MapPin, text: "Check out faster with saved addresses" },
];

/**
 * Sign-in, registration and password pages: one rounded card. The form sits on a white panel;
 * when there is an invitation to the other action it sits on a dark brand panel beside the form,
 * joined to it by a stitched rail. Pages without an aside get a single centred card.
 */
export default function AuthSplit({
  title,
  crumbs,
  aside,
  children,
}: {
  title: string;
  crumbs: Crumb[];
  aside?: { heading: string; text: React.ReactNode; href: string; cta: string };
  children: React.ReactNode;
}) {
  const shadow = "shadow-[0_1px_2px_rgba(24,24,24,0.04),0_24px_48px_-24px_rgba(24,24,24,0.22)]";

  const crumbNav = (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link href={c.href} className="text-ink-secondary hover:text-ink transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink" aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const heading = (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-11 h-11 shrink-0 rounded-xl bg-surface-muted grid place-items-center" aria-hidden="true">
        <Image src="/images/brand/saffronvastra-mark.png" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
      </span>
      <h1 className="text-sm tracking-[0.18em] uppercase font-semibold text-ink-secondary">{title}</h1>
    </div>
  );

  return (
    <div className="bg-surface-muted text-ink min-h-[calc(100vh-200px)]">
      <section className="max-w-[1080px] mx-auto px-4 lg:px-[15px] py-8 md:py-14">
        {crumbNav}

        {aside ? (
          <div className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] rounded-3xl overflow-hidden bg-surface border border-line ${shadow}`}>
            <div className="px-6 py-8 md:px-12 md:py-12">
              {heading}
              {children}
            </div>

            <div className="relative overflow-hidden bg-inverse text-on-inverse px-6 py-10 md:px-10 md:py-12 flex flex-col justify-center">
              <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-24 -left-10 w-60 h-60 rounded-full bg-highlight/15 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-dashed border-inverse-line" aria-hidden="true" />
              <div className="relative">
                <h2 className="font-heading text-2xl md:text-[30px] md:leading-[40px] font-medium">{aside.heading}</h2>
                <p className="mt-3 text-base leading-relaxed text-on-inverse-muted">{aside.text}</p>

                {/* perks joined by a connector */}
                <ul className="mt-6 relative space-y-4">
                  <span className="absolute left-[17px] top-5 bottom-5 border-l border-dashed border-inverse-line" aria-hidden="true" />
                  {perks.map(({ icon: Icon, text }) => (
                    <li key={text} className="relative flex items-center gap-3 text-sm text-on-inverse">
                      <span className="relative z-10 w-9 h-9 shrink-0 rounded-full bg-inverse-hover ring-1 ring-inverse-line grid place-items-center text-highlight" aria-hidden="true">
                        <Icon className="w-4 h-4" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>

                <Link
                  href={aside.href}
                  className="mt-8 inline-flex items-center justify-center h-12 px-7 rounded-full bg-on-inverse text-ink text-base font-semibold transition-colors hover:bg-surface-muted"
                >
                  {aside.cta}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className={`max-w-[640px] mx-auto rounded-3xl bg-surface border border-line overflow-hidden ${shadow}`}>
            <div className="h-1.5 bg-gradient-to-r from-accent via-highlight to-accent" aria-hidden="true" />
            <div className="px-6 py-8 md:px-12 md:py-12">
              {heading}
              {children}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
