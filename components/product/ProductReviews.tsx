"use client";

import { BRAND } from "@/lib/brand";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useStore } from "@/context/StoreContext";

interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  reply: string | null;
  author: string;
  createdAt: string;
}

interface Summary {
  count: number;
  average: number | null;
  distribution: Record<string, number>;
}

type Eligibility =
  | { kind: "loading" }
  | { kind: "visitor" }
  | { kind: "no-purchase" }
  | { kind: "reviewed"; status: string }
  | { kind: "can-review" }
  | { kind: "unknown" };

const formatDay = (v: string) => new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function Stars({ value, size = "w-3.5 h-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-highlight text-highlight" : "text-line-strong"}`} />
      ))}
    </span>
  );
}

export default function ProductReviews({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [eligibility, setEligibility] = useState<Eligibility>({ kind: "loading" });
  const { isAuthenticated, authLoading } = useStore();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/reviews/product/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setSummary(json.data);
      setReviews(json.items);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [slug]);

  const loadEligibility = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/me/reviews/eligibility/${encodeURIComponent(slug)}`, { credentials: "include", cache: "no-store" });
      if (res.status === 401) return setEligibility({ kind: "visitor" });
      if (!res.ok) return setEligibility({ kind: "unknown" });
      const { data } = await res.json();
      if (data.canReview) setEligibility({ kind: "can-review" });
      else if (data.reason === "reviewed") setEligibility({ kind: "reviewed", status: data.review?.status || "Pending" });
      else setEligibility({ kind: "no-purchase" });
    } catch {
      setEligibility({ kind: "unknown" });
    }
  }, [slug]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  // a signed-out visitor is known from the session state, so the eligibility call (which would answer 401) is skipped
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) setEligibility({ kind: "visitor" });
    else void loadEligibility();
  }, [authLoading, isAuthenticated, loadEligibility]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError("");
    setFieldErrors({});
    setSuccess("");
    try {
      const res = await fetch("/api/v1/me/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating: rating || undefined, title: title.trim() || undefined, body }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(json?.message || `Your review could not be sent (HTTP ${res.status}).`);
        setFieldErrors(json?.errors || {});
        if (res.status === 409) void loadEligibility();
        return;
      }
      setSuccess("Thanks, your review will appear after moderation");
      setEligibility({ kind: "reviewed", status: "Pending" });
      setRating(0);
      setTitle("");
      setBody("");
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const err = (name: string) =>
    fieldErrors[name]?.[0] ? (
      <p role="alert" className="text-[11px] text-error mt-1">
        {fieldErrors[name][0]}
      </p>
    ) : null;

  return (
    <div className="space-y-5" data-testid="product-reviews">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h3 className="text-xl font-medium text-ink">Customer Reviews</h3>
        {summary && summary.count > 0 && summary.average !== null && (
          <span className="text-sm font-medium text-ink" data-testid="reviews-average">
            {summary.average.toFixed(1)} / 5.0 ({summary.count} {summary.count === 1 ? "review" : "reviews"})
          </span>
        )}
      </div>

      {loadState === "loading" && <p role="status" className="text-xs text-ink-muted">Loading reviews...</p>}
      {loadState === "error" && (
        <p role="alert" className="text-xs text-error">
          Reviews could not be loaded right now.{" "}
          <button type="button" className="underline font-semibold" onClick={() => void loadReviews()}>
            Try again
          </button>
        </p>
      )}

      {loadState === "ready" && summary && summary.count === 0 && <p className="text-sm text-ink-secondary">No reviews yet.</p>}

      {loadState === "ready" && summary && summary.count > 0 && (
        <>
          <div className="space-y-1" aria-label="Rating distribution">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = summary.distribution[String(n)] || 0;
              const pct = summary.count ? Math.round((c / summary.count) * 100) : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-[11px] text-ink-secondary" data-testid={`dist-${n}`}>
                  <span className="w-10">{n} star</span>
                  <span className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <span className="block h-full bg-highlight" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 text-right">{c}</span>
                </div>
              );
            })}
          </div>

          <ul className="space-y-4 divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="pt-3 space-y-1" data-testid="review-item">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink">{r.author}</span>
                  <span className="text-ink-muted">{formatDay(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} />
                {r.title && <p className="text-sm font-semibold text-ink">{r.title}</p>}
                <p className="text-xs text-ink-secondary font-sans whitespace-pre-line">{r.body}</p>
                {r.reply && (
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-highlight text-xs text-ink-secondary">
                    <span className="font-semibold text-ink">Reply from {BRAND.name}: </span>
                    {r.reply}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="pt-4 border-t border-line" data-testid="review-form-area">
        {eligibility.kind === "visitor" && (
          <p className="text-xs text-ink-secondary">
            <Link href="/auth/login" className="underline font-semibold text-primary">
              Sign in
            </Link>{" "}
            to write a review. Only customers who have received this piece can review it.
          </p>
        )}
        {eligibility.kind === "no-purchase" && (
          <p className="text-xs text-ink-secondary">Only customers who have received this piece can review it. Once your order is delivered you can share your thoughts here.</p>
        )}
        {eligibility.kind === "reviewed" && (
          <p role="status" className="text-xs text-ink-secondary">
            {success || (eligibility.status === "Approved" ? "You have reviewed this piece. Thank you." : "Thanks, your review will appear after moderation")}{" "}
            <Link href="/account" className="underline text-primary">
              Manage it under My Reviews
            </Link>
            .
          </p>
        )}
        {eligibility.kind === "can-review" && (
          <form onSubmit={submit} noValidate aria-label="Write a review" className="space-y-3">
            <h4 className="text-lg font-medium text-ink">Write a review</h4>
            <div>
              <span className="text-xs font-semibold text-ink block mb-1" id="rating-label">
                Your rating
              </span>
              <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                    onClick={() => setRating(n)}
                    className="p-2 -m-1"
                  >
                    <Star className={`w-6 h-6 ${n <= rating ? "fill-highlight text-highlight" : "text-line-strong"}`} />
                  </button>
                ))}
              </div>
              {err("rating")}
            </div>
            <div>
              <label htmlFor="review-title" className="text-xs font-semibold text-ink block mb-1">
                Title (optional)
              </label>
              <input id="review-title" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-line text-sm bg-surface focus:outline-none focus:border-primary" />
              {err("title")}
            </div>
            <div>
              <label htmlFor="review-body" className="text-xs font-semibold text-ink block mb-1">
                Your review
              </label>
              <textarea id="review-body" rows={4} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-3 py-2 border border-line text-sm bg-surface focus:outline-none focus:border-primary" />
              {err("body")}
            </div>
            {formError && Object.keys(fieldErrors).length === 0 && (
              <p role="alert" className="text-xs text-error">
                {formError}
              </p>
            )}
            <button type="submit" disabled={submitting} className="px-8 h-12 rounded-full bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.08em] hover:bg-primary-hover disabled:opacity-50">
              {submitting ? "Sending..." : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
