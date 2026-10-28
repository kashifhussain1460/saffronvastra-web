"use client";

import React from "react";
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

/** Modave "wg-pagination": 40px rounded squares, active page filled with primary. */
export default function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const base =
    "grid h-11 min-w-11 place-items-center rounded-[5px] border px-2 text-base font-medium transition-colors md:h-10 md:min-w-10";
  return (
    <nav aria-label="Pagination" className="mt-10 lg:mt-12">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className={`${base} border-line text-ink hover:border-primary hover:bg-primary hover:text-on-primary disabled:pointer-events-none disabled:text-ink-muted`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        {pageList(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-muted">
              &hellip;
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`${base} ${
                  p === page ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-primary hover:bg-primary hover:text-on-primary"
                }`}
              >
                {p}
              </button>
            </li>
          )
        )}
        <li>
          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className={`${base} border-line text-ink hover:border-primary hover:bg-primary hover:text-on-primary disabled:pointer-events-none disabled:text-ink-muted`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
