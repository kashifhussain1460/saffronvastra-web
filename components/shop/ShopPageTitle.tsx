import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Modave "page-title" band: muted background, centred heading and breadcrumb,
 * with one of our photos bleeding off the right edge on wide screens.
 */
export default function ShopPageTitle({
  title,
  crumbs,
  subtitle,
  image,
  children,
}: {
  title: React.ReactNode;
  crumbs: { label: string; href?: string }[];
  subtitle?: string;
  image?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-surface-muted">
      {image && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] lg:block" aria-hidden="true">
          <Image src={image} alt="" fill sizes="36vw" priority className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-muted via-surface-muted/40 to-transparent" />
        </div>
      )}
      <div className="relative mx-auto flex min-h-[180px] max-w-[1320px] flex-col items-center justify-center px-[15px] py-10 text-center md:min-h-[220px] lg:min-h-[240px]">
        <h1 className="text-[28px] font-medium leading-tight text-ink md:text-[34px] lg:text-[40px] lg:leading-[48px]">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-3">
          <ol className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-ink-muted md:text-base">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />}
                {c.href ? (
                  <Link href={c.href} className="text-ink transition-colors hover:text-primary-hover">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {subtitle && <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary md:text-base">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
