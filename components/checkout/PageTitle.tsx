import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Modave-style page title band: muted ground, centred 40px heading, breadcrumb underneath.
 * Shared by the cart, checkout, order confirmation and wishlist pages.
 */
export default function PageTitle({
  title,
  crumbs,
  children,
}: {
  title: React.ReactNode;
  crumbs: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-surface-muted">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] py-10 md:py-16 lg:py-[68px] text-center">
        <h1 className="font-heading text-[28px] leading-tight md:text-[40px] md:leading-[48px] font-medium text-ink">
          {title}
        </h1>
        <nav aria-label="Breadcrumb" className="mt-2 md:mt-3">
          <ol className="flex flex-wrap justify-center items-center gap-x-1.5 gap-y-1 text-sm text-ink">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                  {c.href && !last ? (
                    <Link href={c.href} className="hover:text-primary-hover transition-colors">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-ink-muted" aria-current={last ? "page" : undefined}>
                      {c.label}
                    </span>
                  )}
                  {!last && <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 text-ink-muted" />}
                </li>
              );
            })}
          </ol>
        </nav>
        {children}
      </div>
    </section>
  );
}
