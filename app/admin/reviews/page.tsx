"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: "Pending" | "Approved" | "Rejected";
  reply: string | null;
  createdAt: string;
  moderatedAt: string | null;
  product: { id: string; title: string; slug: string } | null;
  customer: { id: string; email: string; name: string | null } | null;
}

const TABS = ["Pending", "Approved", "Rejected"] as const;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-primary text-primary" : "text-line-strong"}`} />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pending");
  const [rating, setRating] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15", status: tab });
    if (rating) params.set("rating", rating);
    if (query) params.set("search", query);
    const res = await api(`/api/v1/admin/reviews?${params}`);
    if (!res.ok) {
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setCounts(res.body.counts || {});
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [page, tab, rating, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const setError = (id: string, message: string) => setErrors((e) => ({ ...e, [id]: message }));

  const moderate = async (r: Review, status: Review["status"]) => {
    setBusyId(r.id);
    setError(r.id, "");
    setNotice("");
    const res = await api(`/api/v1/admin/reviews/${r.id}`, { method: "PATCH", json: { status } });
    setBusyId(null);
    if (!res.ok) {
      setError(r.id, res.message);
      return;
    }
    setNotice(`Review ${status.toLowerCase()}.`);
    await load();
  };

  const sendReply = async (r: Review) => {
    setBusyId(r.id);
    setError(r.id, "");
    setNotice("");
    const res = await api(`/api/v1/admin/reviews/${r.id}/reply`, { method: "POST", json: { reply: replies[r.id] || "" } });
    setBusyId(null);
    if (!res.ok) {
      setError(r.id, res.message);
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === r.id ? res.body.data : x)));
    setReplies((prev) => ({ ...prev, [r.id]: "" }));
    setNotice("Reply saved. It shows under the review once the review is approved.");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans text-ink">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">Reviews</h1>
        <p className="text-xs text-ink-muted mt-0.5">Reviews from customers who received the piece. Only approved reviews are shown on the product page.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              tab === t ? "bg-primary text-on-primary border-primary" : "bg-surface text-ink border-line hover:bg-ink/5"
            }`}
          >
            {t} ({counts[t] ?? 0})
          </button>
        ))}
        <select
          aria-label="Filter by rating"
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
          className="ml-auto px-2 py-2 bg-surface border border-line rounded-md text-xs"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "star" : "stars"}
            </option>
          ))}
        </select>
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search reviews"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search review, product, email..."
            className="pl-8 pr-3 py-2 bg-surface border border-line rounded-md text-xs w-64 focus:outline-none focus:border-primary"
          />
        </form>
      </div>

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>The reviews could not be loaded.</span>
          <button type="button" className="underline font-semibold" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-xs text-success">
          {notice}
        </p>
      )}

      <div className="space-y-4">
        {loadState === "loading" && (
          <p role="status" className="text-xs text-ink-muted">
            Loading reviews...
          </p>
        )}
        {loadState === "ready" && items.length === 0 && (
          <p className="p-8 text-center text-sm text-ink-muted bg-surface rounded-xl border border-line">
            {query || rating ? "No reviews match." : `No ${tab.toLowerCase()} reviews.`}
          </p>
        )}
        {items.map((r) => (
          <article key={r.id} data-testid="review-card" className="bg-surface rounded-xl border border-line shadow-2xs p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {r.product ? (
                  <Link href={`/products/${r.product.slug}`} target="_blank" className="font-serif text-lg hover:text-primary-hover">
                    {r.product.title}
                  </Link>
                ) : (
                  <span className="font-serif text-lg">Removed product</span>
                )}
                <p className="text-[11px] text-ink-muted">
                  {r.customer?.name || "Customer"} ({r.customer?.email}) · {formatDateTime(r.createdAt)}
                </p>
              </div>
              <Stars value={r.rating} />
            </div>
            {r.title && <p className="text-sm font-semibold">{r.title}</p>}
            <p className="text-sm text-ink whitespace-pre-wrap bg-canvas border border-line rounded-md p-3">{r.body}</p>

            {r.reply && (
              <div className="text-sm bg-success-bg/60 border border-success-line rounded-md p-3 whitespace-pre-wrap">
                <p className="text-[11px] font-semibold text-success mb-1">Your reply</p>
                {r.reply}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor={`reply-${r.id}`} className="text-xs font-semibold block">
                {r.reply ? "Update reply" : "Reply publicly"}
              </label>
              <textarea
                id={`reply-${r.id}`}
                rows={2}
                maxLength={1000}
                value={replies[r.id] || ""}
                onChange={(e) => setReplies((prev) => ({ ...prev, [r.id]: e.target.value }))}
                className="w-full p-2.5 border border-line rounded-md text-sm bg-surface focus:outline-none focus:border-primary"
              />
              {errors[r.id] && (
                <p role="alert" className="text-xs text-error">
                  {errors[r.id]}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button type="button" disabled={busyId === r.id || !(replies[r.id] || "").trim()} onClick={() => void sendReply(r)} className="px-3 py-1.5 border border-line rounded-md hover:bg-ink/5 disabled:opacity-50">
                  Save reply
                </button>
                {r.status !== "Approved" && (
                  <button type="button" disabled={busyId === r.id} onClick={() => void moderate(r, "Approved")} className="px-3 py-1.5 border border-success-line bg-success-bg text-success rounded-md hover:bg-success-bg disabled:opacity-50">
                    Approve
                  </button>
                )}
                {r.status !== "Rejected" && (
                  <button type="button" disabled={busyId === r.id} onClick={() => void moderate(r, "Rejected")} className="px-3 py-1.5 border border-error-line bg-error-bg text-error rounded-md hover:bg-error-bg disabled:opacity-50">
                    Reject
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>
          {total} {total === 1 ? "review" : "reviews"}
        </span>
        <span className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">
            Previous
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">
            Next
          </button>
        </span>
      </div>
    </div>
  );
}
