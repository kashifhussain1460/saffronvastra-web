"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, CheckCircle2, Circle } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import ProductListItem from "./ProductListItem";
import FilterPanel from "./FilterSidebar";
import SortDropdown from "./SortDropdown";
import GridListToggle from "./GridListToggle";
import Pagination from "./Pagination";
import AppliedFilterChips, { buildChips } from "./AppliedFilterChips";
import MobileFilterDrawer from "./MobileFilterDrawer";
import { useMediaQuery, useShopQuery } from "./hooks";
import {
  applyFilters,
  buildFacetOptions,
  countActiveFilters,
  EMPTY_FILTERS,
  isOnSale,
  ListFacet,
  priceBounds,
  ShopProduct,
  sortProducts,
  ViewMode,
} from "./shopData";

export interface ShopViewProps {
  products: ShopProduct[];
  loadState: "loading" | "ready" | "error";
  onRetry?: () => void;
  /** "sidebar": left sidebar from xl, drawer below (shop-left-sidebar). "canvas": drawer at every width (shop-filter-canvas). */
  layout?: "sidebar" | "canvas";
  labels?: { category?: Record<string, string>; collection?: Record<string, string> };
  hideFacets?: ListFacet[];
  perPage?: number;
  errorText?: string;
  loadingText?: string;
  /** Shown when nothing at all is listed (before filters). */
  emptyCatalogue?: React.ReactNode;
  /** Shown when filters remove every product. */
  emptyFiltered?: (clear: () => void) => React.ReactNode;
}

const GRID_CLASS: Record<Exclude<ViewMode, "list">, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-2 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
};

/**
 * Listing body shared by /collections, /collections/[slug] and /search: toolbar (filters button,
 * sale toggle, layout switch, sort), applied-filter chips, sidebar / drawer filters, grid or list,
 * pagination. All state is in the URL. Filtering and sorting run on the products the page loaded.
 */
export default function ShopView({
  products,
  loadState,
  onRetry,
  layout = "sidebar",
  labels,
  hideFacets = [],
  perPage = 12,
  errorText = "We could not load the collection right now.",
  loadingText = "Loading the collection...",
  emptyCatalogue,
  emptyFiltered,
}: ShopViewProps) {
  const { query, setQuery } = useShopQuery();
  const { filters, sort, page, view } = query;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMd = useMediaQuery("(min-width: 768px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const topRef = useRef<HTMLDivElement>(null);

  const bounds = useMemo(() => priceBounds(products), [products]);
  const options = useMemo(() => buildFacetOptions(products, filters, labels), [products, filters, labels]);
  const filtered = useMemo(() => sortProducts(applyFilters(products, filters), sort), [products, filters, sort]);
  const saleCount = useMemo(() => applyFilters(products, { ...filters, sale: false }).filter(isOnSale).length, [products, filters]);
  const anySale = useMemo(() => products.some(isOnSale), [products]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Requested layout, narrowed to what fits this screen (4 columns from xl, 3 from md).
  const wanted: ViewMode = view ?? "4";
  const effective: ViewMode = wanted === "list" ? "list" : (String(Math.min(Number(wanted), isXl ? 4 : isMd ? 3 : 2)) as ViewMode);
  const showSidebar = layout === "sidebar" && sidebarOpen;

  const toggle = (facet: ListFacet, value: string) =>
    setQuery((q) => {
      const cur = q.filters[facet];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...q, page: 1, filters: { ...q.filters, [facet]: next } };
    });
  const setPrice = (min: number | null, max: number | null) => setQuery((q) => ({ ...q, page: 1, filters: { ...q.filters, min, max } }));
  const setSale = (on: boolean) => setQuery((q) => ({ ...q, page: 1, filters: { ...q.filters, sale: on } }));
  const clearAll = () =>
    setQuery((q) => ({
      ...q,
      page: 1,
      // facets the page fixes (e.g. its own collection) are not part of the visitor's filters
      filters: { ...EMPTY_FILTERS, ...Object.fromEntries(hideFacets.map((f) => [f, q.filters[f]])) },
    }));
  const goPage = (p: number) => {
    setQuery((q) => ({ ...q, page: p }));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chips = buildChips(filters, options, { toggle, price: () => setPrice(null, null), sale: () => setSale(false) }, hideFacets);
  const active = countActiveFilters({ ...filters, ...Object.fromEntries(hideFacets.map((f) => [f, []])) });

  // Close the drawer if the screen grows into the sidebar layout.
  useEffect(() => {
    if (isXl && layout === "sidebar") setDrawerOpen(false);
  }, [isXl, layout]);

  const panel = (idPrefix: string) => (
    <FilterPanel
      idPrefix={idPrefix}
      filters={filters}
      options={options}
      bounds={bounds}
      onToggle={toggle}
      onPrice={setPrice}
      onSale={setSale}
      saleCount={saleCount}
      hide={hideFacets}
    />
  );

  const onFiltersButton = () => {
    if (layout === "sidebar" && isXl) setSidebarOpen((o) => !o);
    else setDrawerOpen(true);
  };

  return (
    <div ref={topRef} className="mx-auto max-w-[1320px] scroll-mt-24 px-[15px] pb-16 pt-6 md:pt-10 lg:pb-24 xl:pt-20">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={onFiltersButton}
            aria-controls={layout === "sidebar" && isXl ? "shop-sidebar" : "shop-filter-drawer"}
            aria-expanded={layout === "sidebar" && isXl ? sidebarOpen : drawerOpen}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded border-2 border-line px-3 text-base text-ink transition-colors hover:border-ink md:h-9 md:px-2.5"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {active > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-on-primary">{active}</span>
            )}
          </button>
          {anySale && (
            <button
              type="button"
              onClick={() => setSale(!filters.sale)}
              aria-pressed={filters.sale}
              className={`hidden min-h-[36px] items-center gap-2 text-sm transition-colors hover:text-primary-hover lg:inline-flex ${filters.sale ? "text-secondary" : "text-ink"}`}
            >
              {filters.sale ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Circle className="h-5 w-5 text-ink-muted" aria-hidden="true" />}
              Shop sale items only
            </button>
          )}
        </div>

        <div className="flex shrink-0 justify-center">
          <GridListToggle active={effective} onChange={(v) => setQuery((q) => ({ ...q, view: v }))} />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <span className="hidden text-sm text-ink lg:inline">Sort by:</span>
          <SortDropdown value={sort} onChange={(v) => setQuery((q) => ({ ...q, sort: v, page: 1 }))} />
        </div>
      </div>

      {/* Count + applied filters */}
      <div className="mt-5 md:mt-7">
        <AppliedFilterChips count={filtered.length} chips={chips} onClearAll={clearAll} />
      </div>

      <div className="mt-6 flex items-start gap-[30px] md:mt-8">
        {layout === "sidebar" && (
          <aside id="shop-sidebar" aria-label="Filters" className={`w-[300px] shrink-0 ${showSidebar ? "hidden xl:block" : "hidden"}`}>
            {panel("side")}
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {loadState === "loading" ? (
            <div>
              <p role="status" className="sr-only">
                {loadingText}
              </p>
              <div aria-hidden="true" className={`grid gap-x-[15px] gap-y-[30px] xl:gap-x-[30px] xl:gap-y-10 ${GRID_CLASS["4"]}`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i}>
                    <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-surface-muted" />
                    <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
                    <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
                  </div>
                ))}
              </div>
            </div>
          ) : loadState === "error" ? (
            <div role="alert" className="rounded-lg border border-line px-6 py-16 text-center">
              <p className="text-base text-ink-secondary">{errorText}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 h-11 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary hover:bg-primary-hover"
                >
                  Try again
                </button>
              )}
            </div>
          ) : products.length === 0 && emptyCatalogue ? (
            emptyCatalogue
          ) : filtered.length === 0 ? (
            emptyFiltered ? (
              emptyFiltered(clearAll)
            ) : (
              <div className="rounded-lg border border-line px-6 py-16 text-center">
                <h2 className="text-2xl font-medium text-ink">No products match these filters</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-secondary">Try removing a filter or widening the price range.</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-6 h-11 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary hover:bg-primary-hover"
                >
                  Clear all filters
                </button>
              </div>
            )
          ) : effective === "list" ? (
            <div className="space-y-8 lg:space-y-10">
              {pageItems.map((p) => (
                <ProductListItem key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className={`grid gap-x-[15px] gap-y-[30px] xl:gap-x-[30px] xl:gap-y-10 ${GRID_CLASS[wanted === "list" ? "4" : wanted]}`}>
              {pageItems.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  priority={i < 4}
                  imageSizes={
                    effective === "2"
                      ? "(max-width: 767px) 50vw, 600px"
                      : effective === "3"
                      ? "(max-width: 1279px) 33vw, 420px"
                      : "(max-width: 767px) 50vw, 300px"
                  }
                />
              ))}
            </div>
          )}

          {loadState === "ready" && <Pagination page={currentPage} totalPages={totalPages} onChange={goPage} />}
        </div>
      </div>

      <MobileFilterDrawer id="shop-filter-drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)} onReset={clearAll} resultCount={filtered.length}>
        {panel("drawer")}
      </MobileFilterDrawer>
    </div>
  );
}
