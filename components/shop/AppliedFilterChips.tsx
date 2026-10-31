"use client";

import React from "react";
import { X } from "lucide-react";
import { FacetOption, formatINR, LIST_FACETS, ListFacet, ShopFilters } from "./shopData";

export interface Chip {
  key: string;
  label: string;
  hex?: string;
  remove: () => void;
}

export function buildChips(
  f: ShopFilters,
  options: Record<ListFacet, FacetOption[]>,
  on: { toggle: (facet: ListFacet, v: string) => void; price: () => void; sale: () => void },
  hide: ListFacet[] = []
): Chip[] {
  const chips: Chip[] = [];
  for (const facet of LIST_FACETS) {
    if (hide.includes(facet)) continue;
    for (const v of f[facet]) {
      const opt = options[facet].find((o) => o.value === v);
      chips.push({
        key: `${facet}:${v}`,
        label: facet === "size" ? `Size ${v}` : opt?.label || v.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        hex: facet === "colour" ? opt?.hex : undefined,
        remove: () => on.toggle(facet, v),
      });
    }
  }
  if (f.min !== null || f.max !== null) {
    chips.push({
      key: "price",
      label: f.min !== null && f.max !== null ? `${formatINR(f.min)} – ${formatINR(f.max)}` : f.min !== null ? `From ${formatINR(f.min)}` : `Up to ${formatINR(f.max!)}`,
      remove: on.price,
    });
  }
  if (f.sale) chips.push({ key: "sale", label: "On sale", remove: on.sale });
  return chips;
}

/** Modave "meta-filter-shop": count, removable pills and a dark "Remove all" pill. */
export default function AppliedFilterChips({ count, chips, onClearAll }: { count: number; chips: Chip[]; onClearAll: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <p className="mr-1 flex items-center text-sm text-ink-secondary" aria-live="polite">
        {`${count} ${count === 1 ? "Product" : "Products"} Found`}
        <span aria-hidden="true" className="ml-2.5 inline-block h-3.5 w-px bg-line" />
      </p>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.remove}
          aria-label={`Remove filter ${c.label}`}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-line px-3 text-sm capitalize text-ink transition-colors hover:border-primary md:min-h-[32px]"
        >
          {c.hex && <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />}
          {c.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
      {chips.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-hover md:min-h-[32px]"
        >
          Clear all
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
