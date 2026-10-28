"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import PriceTag from "@/components/ui/PriceTag";
import { usePresence, useScrollLock, useEscape, useDialogFocus } from "@/components/ui/Offcanvas";
import { useCatalogNav, useFeaturedProducts } from "@/components/layout/useCatalogNav";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";

const POPULAR_TERMS = ["Velvet Jackets", "Hand Embroidered", "Festive"];
const MAX_RESULTS = 8;

// Modave search popup: centred white modal with a title row, a bordered input, keyword pills and a product grid.
export default function SearchModal() {
  const { isSearchOpen, closeSearch, searchQuery, setSearchQuery } = useStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [liveResults, setLiveResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const { mounted, visible } = usePresence(isSearchOpen, 250);
  useScrollLock(isSearchOpen);
  useEscape(isSearchOpen, closeSearch);
  useDialogFocus(isSearchOpen, panelRef, inputRef);

  // Featured suggestions for the empty box come from the live catalogue.
  const suggested = useFeaturedProducts(isSearchOpen, 4);
  const { categories } = useCatalogNav(isSearchOpen);

  // Live backend search with 250ms debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchFailed(false);
    const handler = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Search failed");
        })
        .then((data) => {
          if (data.items && Array.isArray(data.items)) {
            const mapped = data.items.map(mapBackendProductToFrontend);
            setLiveResults(mapped);
          } else {
            setLiveResults([]);
          }
        })
        .catch((err) => {
          console.warn("Live search API failed:", err);
          setLiveResults([]);
          setSearchFailed(true);
        })
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  if (!mounted) return null;

  // Results are the API's answer only; there is no built-in product list to fall back to.
  const hasQuery = !!searchQuery.trim();
  const filtered = hasQuery ? liveResults ?? [] : suggested;
  const terms = Array.from(new Set([...categories.map((c) => c.name), ...POPULAR_TERMS]));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain" role="dialog" aria-modal="true" aria-label="Search Catalog">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeSearch}
        className={`fixed inset-0 bg-ink/20 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      <div className="relative flex min-h-full items-start justify-center px-[23px] py-2 md:px-6 md:py-7 pointer-events-none">
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`pointer-events-auto relative w-full max-w-[1070px] rounded-lg bg-canvas p-[15px] md:p-10 outline-none transition-[opacity,transform] duration-200 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
          }`}
        >
          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium text-ink">Search</h2>
            <button
              type="button"
              onClick={closeSearch}
              className="w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-full bg-surface-muted text-ink inline-flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input */}
          <form
            role="search"
            className="relative mt-5 md:mt-7"
            onSubmit={(e) => {
              e.preventDefault();
              if (!hasQuery) return;
              closeSearch();
              router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full h-12 rounded-lg border-2 border-line bg-canvas pl-3.5 pr-24 text-base text-ink placeholder:text-ink-muted outline-none focus:border-ink transition-colors"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="h-10 px-2 text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  Clear
                </button>
              )}
              <button type="submit" aria-label="Show all results" className="w-10 h-10 inline-flex items-center justify-center text-ink hover:text-primary-hover transition-colors">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </form>

          {/* Keywords */}
          <div className="mt-6 md:mt-8">
            <h3 className="mb-4 text-xl font-medium text-ink">Popular searches</h3>
            <ul className="flex flex-wrap gap-2.5">
              {terms.map((term) => (
                <li key={term}>
                  <button
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="inline-flex items-center h-9 px-4 rounded-full border border-line text-base text-ink hover:border-ink hover:text-primary-hover transition-colors"
                  >
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Results */}
          <div className="mt-8 md:mt-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-medium text-ink" aria-live="polite">
                {hasQuery ? (isSearching && liveResults === null ? "Searching…" : `Results (${filtered.length})`) : "Featured products"}
              </h3>
              {hasQuery && (
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  onClick={closeSearch}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4 hover:text-primary-hover"
                >
                  View all results <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {searchFailed ? (
              <p role="alert" className="py-8 text-center text-sm text-error">
                Search is unavailable right now. Please try again shortly.
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                {hasQuery
                  ? isSearching
                    ? "Searching…"
                    : `No pieces found matching “${searchQuery}”. Try another term.`
                  : "No suggestions available right now."}
              </p>
            ) : (
              <ul className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-[15px] md:gap-x-[30px] gap-y-6 md:gap-y-8">
                {filtered.slice(0, MAX_RESULTS).map((product) => (
                  <li key={product.id}>
                    <Link href={`/products/${product.slug}`} onClick={closeSearch} className="group block">
                      <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-surface-muted">
                        {product.images[0] && (
                          <Image
                            src={product.images[0]}
                            alt=""
                            fill
                            sizes="(min-width: 1280px) 230px, (min-width: 1024px) 30vw, 45vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </span>
                      <span className="mt-3 text-base text-ink line-clamp-1 group-hover:text-primary-hover transition-colors">
                        {product.title}
                      </span>
                    </Link>
                    <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} comparePosition="before" showDiscount={false} size="md" className="mt-1" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
