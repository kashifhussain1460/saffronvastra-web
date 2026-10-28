"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import FilterAccordion from "./FilterAccordion";
import PriceRangeFilter from "./PriceRangeFilter";
import { FACET_TITLES, FacetOption, ListFacet, ShopFilters } from "./shopData";

// Colours shown before "Show more"; a selected colour is always kept visible.
const COLOUR_LIMIT = 8;

export interface FilterPanelProps {
  filters: ShopFilters;
  options: Record<ListFacet, FacetOption[]>;
  bounds: { floor: number; ceiling: number };
  onToggle: (facet: ListFacet, value: string) => void;
  onPrice: (min: number | null, max: number | null) => void;
  onSale?: (on: boolean) => void;
  /** Only shown when at least one listed piece has a compare price. */
  saleCount?: number;
  /** Facets the page wants hidden (e.g. "collection" on a collection page). */
  hide?: ListFacet[];
  idPrefix: string;
}

/** The facet groups, shared by the desktop sidebar and the mobile / canvas filter drawer. */
export default function FilterPanel({ filters, options, bounds, onToggle, onPrice, onSale, saleCount = 0, hide = [], idPrefix }: FilterPanelProps) {
  const [showAllColours, setShowAllColours] = useState(false);
  const show = (f: ListFacet) => !hide.includes(f) && options[f].length > 0;

  const linkList = (facet: ListFacet) => (
    <ul className="space-y-1 xl:space-y-3">
      {options[facet].map((o) => {
        const on = filters[facet].includes(o.value);
        return (
          <li key={o.value}>
            <button
              type="button"
              onClick={() => onToggle(facet, o.value)}
              aria-pressed={on}
              className={`flex min-h-[44px] items-center text-left text-base capitalize transition-colors hover:text-primary-hover xl:min-h-0 xl:leading-[26px] ${
                on ? "text-secondary" : "text-ink"
              }`}
            >
              {o.label}&nbsp;<span className={on ? "" : "text-ink"}>({o.count})</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const checkList = (facet: ListFacet) => (
    <ul className="space-y-1 xl:space-y-2.5">
      {options[facet].map((o) => {
        const on = filters[facet].includes(o.value);
        const id = `${idPrefix}-${facet}-${o.value.replace(/[^a-z0-9]+/gi, "-")}`;
        return (
          <li key={o.value}>
            <label htmlFor={id} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-base text-ink xl:min-h-0">
              <span className="relative grid h-[18px] w-[18px] shrink-0 place-items-center">
                <input
                  id={id}
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(facet, o.value)}
                  className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[3px] border border-line-strong bg-surface checked:border-primary checked:bg-primary"
                />
                <Check className="pointer-events-none absolute h-3 w-3 text-on-primary opacity-0 peer-checked:opacity-100" aria-hidden="true" />
              </span>
              <span>
                {o.label} <span className="text-ink-muted">({o.count})</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      {show("category") && <FilterAccordion title="Product Categories">{linkList("category")}</FilterAccordion>}
      {show("collection") && <FilterAccordion title="Collections">{linkList("collection")}</FilterAccordion>}

      <FilterAccordion title="Price">
        <PriceRangeFilter idPrefix={`${idPrefix}-price`} floor={bounds.floor} ceiling={bounds.ceiling} min={filters.min} max={filters.max} onCommit={onPrice} />
      </FilterAccordion>

      {show("size") && (
        <FilterAccordion title={FACET_TITLES.size}>
          <div className="flex flex-wrap gap-2.5">
            {options.size.map((o) => {
              const on = filters.size.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onToggle("size", o.value)}
                  aria-pressed={on}
                  aria-label={`Size ${o.value} (${o.count})`}
                  disabled={o.count === 0 && !on}
                  className={`grid h-11 min-w-11 place-items-center rounded-full border px-3 text-base transition-colors disabled:cursor-not-allowed disabled:text-ink-muted ${
                    on ? "border-primary bg-primary text-on-primary" : "border-line text-ink hover:border-primary"
                  }`}
                >
                  {o.value}
                </button>
              );
            })}
          </div>
        </FilterAccordion>
      )}

      {show("colour") && (
        <FilterAccordion title="Colors">
          <div className="flex flex-wrap gap-2 xl:gap-2.5">
            {options.colour.filter((o, i) => showAllColours || i < COLOUR_LIMIT || filters.colour.includes(o.value)).map((o) => {
              const on = filters.colour.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onToggle("colour", o.value)}
                  aria-pressed={on}
                  aria-label={`Colour ${o.value} (${o.count})`}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-sm transition-colors xl:min-h-[34px] xl:text-base ${
                    on ? "border-primary text-ink" : "border-line text-ink hover:border-primary"
                  }`}
                >
                  <span className="h-5 w-5 shrink-0 rounded-full border border-line" style={o.hex ? { backgroundColor: o.hex } : undefined} />
                  {o.label}
                </button>
              );
            })}
          </div>
          {options.colour.length > COLOUR_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllColours((v) => !v)}
              aria-expanded={showAllColours}
              className="mt-3 min-h-[44px] text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary-hover xl:min-h-0"
            >
              {showAllColours ? "Show less" : `Show more (${options.colour.length - COLOUR_LIMIT})`}
            </button>
          )}
        </FilterAccordion>
      )}

      {show("availability") && <FilterAccordion title={FACET_TITLES.availability}>{checkList("availability")}</FilterAccordion>}
      {show("material") && <FilterAccordion title={FACET_TITLES.material}>{checkList("material")}</FilterAccordion>}
      {show("embroidery") && <FilterAccordion title={FACET_TITLES.embroidery}>{checkList("embroidery")}</FilterAccordion>}

      {onSale && saleCount > 0 && (
        <FilterAccordion title="Offers">
          <label htmlFor={`${idPrefix}-sale`} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-base text-ink xl:min-h-0">
            <span className="relative grid h-[18px] w-[18px] shrink-0 place-items-center">
              <input
                id={`${idPrefix}-sale`}
                type="checkbox"
                checked={filters.sale}
                onChange={(e) => onSale(e.target.checked)}
                className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[3px] border border-line-strong bg-surface checked:border-primary checked:bg-primary"
              />
              <Check className="pointer-events-none absolute h-3 w-3 text-on-primary opacity-0 peer-checked:opacity-100" aria-hidden="true" />
            </span>
            <span>
              On sale <span className="text-ink-muted">({saleCount})</span>
            </span>
          </label>
        </FilterAccordion>
      )}
    </div>
  );
}
