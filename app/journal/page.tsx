import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";
import JournalCard, { type JournalSummary } from "@/components/content/JournalCard";

export const metadata = {
  alternates: { canonical: "/journal" },
  title: "The Saffron Journal | Wear Stories & Atelier Notes",
  description:
    "Stories of Rajasthani craftsmanship, silk velvet styling, generational embroidery arts, and behind-the-seams atelier chronicles.",
};

export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:4000";

interface JournalPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

// Page numbers to show: first, last, current and its neighbours, with gaps marked as null.
function pageList(current: number, total: number): (number | null)[] {
  const wanted = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { category, page } = await searchParams;
  const query = new URLSearchParams({ limit: "9" });
  if (category) query.set("category", category);
  if (page) query.set("page", page);

  let articles: JournalSummary[] = [];
  let categories: string[] = [];
  let totalPages = 1;
  let currentPage = 1;
  let loadFailed = false;
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/journal?${query}`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    articles = body.items ?? [];
    categories = body.categories ?? [];
    totalPages = body.pagination?.totalPages || 1;
    currentPage = body.pagination?.page || 1;
  } catch {
    loadFailed = true;
  }
  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (n > 1) p.set("page", String(n));
    const q = p.toString();
    return q ? `/journal?${q}` : "/journal";
  };

  const pill = (active: boolean) =>
    `inline-flex items-center min-h-11 md:min-h-10 px-4 rounded-full text-sm font-medium border transition-colors ${
      active ? "bg-primary text-on-primary border-primary" : "bg-surface border-line text-ink hover:border-ink"
    }`;
  const pageBox =
    "inline-flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-[5px] border text-base font-semibold transition-colors";

  return (
    <div className="bg-canvas text-ink">
      <PageTitle title="The Saffron Journal" crumbs={[{ label: "Home", href: "/" }, { label: "Journal" }]}>
        <p className="mt-3 text-sm md:text-base text-ink-secondary max-w-2xl mx-auto">
          Essays on generational textile heritage, styling notes from our Jaipur salon, and quiet reflections on intentional luxury.
        </p>
      </PageTitle>

      <section className="py-10 md:py-20">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px]">
          {categories.length > 0 && (
            <nav aria-label="Journal categories" className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
              <Link href="/journal" aria-current={!category ? "page" : undefined} className={pill(!category)}>
                All
              </Link>
              {categories.map((c) => {
                const active = category?.toLowerCase() === c.toLowerCase();
                return (
                  <Link key={c} href={`/journal?category=${encodeURIComponent(c)}`} aria-current={active ? "page" : undefined} className={pill(active)}>
                    {c}
                  </Link>
                );
              })}
            </nav>
          )}

          {loadFailed && (
            <p role="alert" className="text-center text-sm text-error bg-error-bg border border-error-line rounded-lg p-4">
              The journal could not be loaded right now. Please try again in a moment.
            </p>
          )}
          {!loadFailed && articles.length === 0 && (
            <div className="text-center py-12 md:py-16 space-y-4">
              <p className="text-base text-ink-secondary">{category ? "No stories in this category yet." : "No stories yet."}</p>
              {category && (
                <Link href="/journal" className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors">
                  View all stories
                </Link>
              )}
            </div>
          )}

          {articles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[15px] md:gap-x-[30px] gap-y-[30px] md:gap-y-10">
              {articles.map((article) => (
                <JournalCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Journal pages" className="mt-10 md:mt-12">
              <ul className="flex flex-wrap items-center justify-center gap-2">
                {currentPage > 1 && (
                  <li>
                    <Link href={pageHref(currentPage - 1)} aria-label="Previous page" className={`${pageBox} border-line text-ink hover:border-ink`}>
                      <ChevronLeft aria-hidden="true" className="w-4 h-4" />
                    </Link>
                  </li>
                )}
                {pageList(currentPage, totalPages).map((n, i) =>
                  n === null ? (
                    <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-muted">
                      …
                    </li>
                  ) : (
                    <li key={n}>
                      <Link
                        href={pageHref(n)}
                        aria-label={`Page ${n}`}
                        aria-current={n === currentPage ? "page" : undefined}
                        className={`${pageBox} ${n === currentPage ? "bg-primary text-on-primary border-primary" : "border-line text-ink hover:border-ink"}`}
                      >
                        {n}
                      </Link>
                    </li>
                  )
                )}
                {currentPage < totalPages && (
                  <li>
                    <Link href={pageHref(currentPage + 1)} aria-label="Next page" className={`${pageBox} border-line text-ink hover:border-ink`}>
                      <ChevronRight aria-hidden="true" className="w-4 h-4" />
                    </Link>
                  </li>
                )}
              </ul>
              <p className="sr-only">
                Page {currentPage} of {totalPages}
              </p>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
