"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import ShopPageTitle from "@/components/shop/ShopPageTitle";
import ShopView from "@/components/shop/ShopView";
import { ShopProduct, toShopProduct } from "@/components/shop/shopData";

const POPULAR = ["Velvet Jackets", "Handworked Kimonos", "Co-ord Sets", "Ivory", "Maroon", "Zari Embroidery", "Festive"];

/**
 * Search results (Modave "search-result" + the shop toolbar). The text search is done by the API
 * (/api/v1/search, first 24 matches); filters, sort and layout then work on those results in the page.
 */
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeQuery = (searchParams.get("q") || searchParams.get("query") || "").trim();

  const [searchTerm, setSearchTerm] = useState(activeQuery);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [recommended, setRecommended] = useState<ShopProduct[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string> | undefined>(undefined);

  // Keep the field in step with the URL (back / forward between searches).
  useEffect(() => setSearchTerm(activeQuery), [activeQuery]);

  // The API does the text search; its answer is shown as it is, including "no results".
  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    const url = activeQuery ? `/api/v1/search?q=${encodeURIComponent(activeQuery)}` : `/api/v1/products?limit=24`;
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Search API failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(Array.isArray(data.items) ? data.items.map(toShopProduct) : []);
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeQuery, reloadKey]);

  // Recommendations for the empty state and the category names come from the live catalogue.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/products?limit=4&sort=featured")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.items)) setRecommended(data.items.map(toShopProduct));
      })
      .catch(() => undefined);
    fetch("/api/v1/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.data)) setCategoryLabels(Object.fromEntries(d.data.map((c: any) => [c.slug, String(c.name)])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
  };

  const emptyResults = (
    <div className="px-2 py-10 text-center sm:py-14">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted text-ink">
        <Search className="h-7 w-7 stroke-[1.5]" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-medium text-ink sm:text-3xl">No Bespoke Pieces Found</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary sm:text-base">
        We couldn&rsquo;t locate any garments matching &ldquo;{activeQuery}&rdquo;. Explore our bestselling heritage velvet jackets and
        artisanal kimonos below.
      </p>
      <button
        type="button"
        onClick={() => router.push("/collections")}
        className="mt-6 h-12 rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-hover"
      >
        View All Collections
      </button>
      {recommended.length > 0 && (
        <div className="mt-14 border-t border-line pt-12 text-left">
          <h3 className="mb-8 text-center text-2xl font-medium text-ink md:text-[32px]">Curated Recommendations</h3>
          <div className="grid grid-cols-2 gap-x-[15px] gap-y-[30px] md:grid-cols-4 xl:gap-x-[30px]">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <ShopPageTitle
        title={
          activeQuery ? (
            <>
              Search Results for &ldquo;{activeQuery}&rdquo;
            </>
          ) : (
            "Search"
          )
        }
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        image="/images/hero/collections_hero.jpg"
      />

      {/* Search field + quick links (Modave: centred 630px field under the band) */}
      <section className="mx-auto max-w-[660px] px-[15px] pt-10 md:pt-16 xl:pt-20">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go(searchTerm);
          }}
        >
          <label htmlFor="search-page-input" className="sr-only">
            Search products
          </label>
          <div className="flex h-12 items-center rounded-lg border-2 border-line bg-surface pl-4 transition-colors focus-within:border-primary">
            <input
              id="search-page-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by garment, fabric, color, or embroidery..."
              className="h-full w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  router.push("/search");
                }}
                className="grid h-11 w-11 shrink-0 place-items-center text-ink-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="submit" aria-label="Search" className="grid h-11 w-12 shrink-0 place-items-center text-ink hover:text-primary-hover">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-y-1 text-sm md:text-base">
          <span className="mr-1 font-semibold text-ink">Quick link:</span>
          {POPULAR.map((chip, i) => (
            <React.Fragment key={chip}>
              <button type="button" onClick={() => go(chip)} className="min-h-[36px] text-ink transition-colors hover:text-primary-hover">
                {chip}
              </button>
              {i < POPULAR.length - 1 && <span aria-hidden="true" className="mr-1.5 text-ink-muted">,</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      <ShopView
        products={products}
        loadState={loadState}
        onRetry={() => setReloadKey((k) => k + 1)}
        layout="canvas"
        labels={{ category: categoryLabels }}
        hideFacets={["collection"]}
        errorText="We could not search the catalogue right now."
        loadingText="Searching the catalogue..."
        emptyCatalogue={emptyResults}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas py-20">
          <p role="status" className="text-base text-ink-secondary">
            Searching the catalogue...
          </p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
