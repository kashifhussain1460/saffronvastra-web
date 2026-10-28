import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";
import PolicyNav from "./PolicyNav";

export interface PolicySectionRef {
  id: string;
  label: string;
}

/**
 * Modave "Terms of use" layout: title band, sticky contents list on the left, the document on the right.
 * The page's summary card and related-policy links close the document.
 */
export default function PolicyLayout({
  title,
  crumb,
  intro,
  meta,
  sections,
  summary,
  links,
  children,
}: {
  title: string;
  crumb: string;
  intro?: string;
  meta?: React.ReactNode;
  sections: PolicySectionRef[];
  summary?: { title: string; items: string[]; footer?: React.ReactNode };
  links: { title: string; items: { href: string; label: string }[] };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas text-ink">
      <PageTitle title={title} crumbs={[{ label: "Home", href: "/" }, { label: "Policies" }, { label: crumb }]} />

      <section className="py-10 md:py-20">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-[60px]">
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 min-w-0">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <PolicyNav sections={sections} />
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 min-w-0 xl:pl-10">
            {intro && <p className="text-base md:text-lg leading-7 text-ink">{intro}</p>}
            {meta && <p className="mt-3 text-sm text-ink-muted">{meta}</p>}
            <div className={`${intro || meta ? "mt-8 md:mt-10 " : ""}space-y-8 md:space-y-10 text-base leading-[26px] text-ink-secondary`}>{children}</div>

            <div className={`mt-10 md:mt-14 pt-8 md:pt-10 border-t border-line grid grid-cols-1 ${summary ? "md:grid-cols-2" : ""} gap-6 md:gap-[30px]`}>
              {summary && (
              <div className="rounded-2xl bg-surface-muted p-6 space-y-4">
                <h2 className="text-xl leading-7 font-medium text-ink">{summary.title}</h2>
                <ul className="space-y-2.5 text-sm leading-[22px] text-ink-secondary list-disc pl-5 marker:text-ink-muted">
                  {summary.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {summary.footer && <div className="pt-4 border-t border-line">{summary.footer}</div>}
              </div>
              )}

              <div>
                <h2 className="text-xl leading-7 font-medium text-ink mb-3">{links.title}</h2>
                <ul className="divide-y divide-line border-y border-line">
                  {links.items.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="flex items-center justify-between gap-3 min-h-12 py-2 text-base text-ink-secondary hover:text-primary-hover transition-colors">
                        <span>{l.label}</span>
                        <ArrowRight aria-hidden="true" className="w-4 h-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PolicySection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 space-y-3">
      <h2 id={`${id}-title`} className="text-lg leading-6 md:text-2xl md:leading-[30px] font-medium text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export const policyList = "list-disc pl-5 space-y-1.5";
export const policyNote = "rounded-xl bg-surface-muted p-4 md:p-5 space-y-2 text-ink";
export const policyLink = "text-ink underline underline-offset-2 hover:text-primary-hover";
