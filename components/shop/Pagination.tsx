"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}

/**
 * Props that let a crawlable <Link> keep the in-page behaviour of the button it replaces: a plain click,
 * Enter or Space runs `onActivate` without a navigation (the listing state lives in the URL already), while
 * crawlers and modified clicks (new tab or window) follow the href. It keeps the button role so assistive
 * technology announces the control as before.
 */
export function inPageLinkProps(onActivate: () => void) {
  return {
    role: "button" as const,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      onActivate();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (e.key !== " ") return;
      e.preventDefault();
      onActivate();
    },
  };
}

/**
 * Modave "wg-pagination": 40px rounded squares, active page filled with primary.
 * With `hrefFor`, every enabled control is a real link to its page (?page=N) so the pages are crawlable.
 */
export default function Pagination({
  page,
  totalPages,
  onChange,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  hrefFor?: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  const base =
    "grid h-11 min-w-11 place-items-center rounded-[5px] border px-2 text-base font-medium transition-colors md:h-10 md:min-w-10";

  // A disabled control stays a disabled button: there is no page to link to.
  const control = (
    target: number,
    props: { className: string; "aria-label": string; "aria-current"?: "page"; disabled?: boolean },
    children: React.ReactNode
  ) =>
    hrefFor && !props.disabled ? (
      <Link
        href={hrefFor(target)}
        prefetch={false}
        aria-label={props["aria-label"]}
        aria-current={props["aria-current"]}
        className={props.className}
        {...inPageLinkProps(() => onChange(target))}
      >
        {children}
      </Link>
    ) : (
      <button type="button" onClick={() => onChange(target)} {...props}>
        {children}
      </button>
    );

  return (
    <nav aria-label="Pagination" className="mt-10 lg:mt-12">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {control(
            page - 1,
            {
              disabled: page <= 1,
              "aria-label": "Previous page",
              className: `${base} border-line text-ink hover:border-primary hover:bg-primary hover:text-on-primary disabled:pointer-events-none disabled:text-ink-muted`,
            },
            <ChevronLeft className="h-4 w-4" />
          )}
        </li>
        {pageList(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-muted">
              &hellip;
            </li>
          ) : (
            <li key={p}>
              {control(
                p,
                {
                  "aria-current": p === page ? "page" : undefined,
                  "aria-label": `Page ${p}`,
                  className: `${base} ${
                    p === page ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-primary hover:bg-primary hover:text-on-primary"
                  }`,
                },
                p
              )}
            </li>
          )
        )}
        <li>
          {control(
            page + 1,
            {
              disabled: page >= totalPages,
              "aria-label": "Next page",
              className: `${base} border-line text-ink hover:border-primary hover:bg-primary hover:text-on-primary disabled:pointer-events-none disabled:text-ink-muted`,
            },
            <ChevronRight className="h-4 w-4" />
          )}
        </li>
      </ul>
    </nav>
  );
}
