"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus, Search } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";
import { badgeClass, btnPrimary, btnSecondary, discountLabel, SALE_STATE_STYLE, type Sale, type SaleState } from "@/lib/adminMarketing";

const STATES: Array<SaleState | ""> = ["", "Live", "Scheduled", "Draft", "Paused", "Expired", "Ended"];

export default function DiscountsPage() {
  const [items, setItems] = useState<Sale[]>([]);
  const [state, setState] = useState<SaleState | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoadState("loading");
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (state) params.set("state", state);
    if (query.trim()) params.set("q", query.trim());
    const res = await api<{ data: Sale[]; pagination: { totalPages: number } }>(`/api/v1/admin/discounts?${params}`);
    if (request !== latest.current) return; // a newer search has been sent
    if (res.ok && res.body) {
      setItems(res.body.data);
      setTotalPages(res.body.pagination.totalPages);
      setLoadState("ready");
    } else {
      setError(res.message);
      setLoadState("error");
    }
  }, [page, state, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Discounts</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Time-limited sales on chosen pieces. The sale price shows across the shop and is what checkout charges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/marketing/sales" className={btnSecondary}>
            <BarChart3 className="w-4 h-4" /> Sales dashboard
          </Link>
          <Link href="/admin/marketing/discounts/new" className={btnPrimary}>
            <Plus className="w-4 h-4" /> New sale
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <label htmlFor="sale-search" className="sr-only">Search sales</label>
          <input
            id="sale-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name"
            className="w-full pl-9 pr-3 py-2 bg-surface border border-line rounded-md text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <label htmlFor="sale-state" className="sr-only">Status</label>
        <select
          id="sale-state"
          value={state}
          onChange={(e) => {
            setState(e.target.value as SaleState | "");
            setPage(1);
          }}
          className="px-3 py-2 bg-surface border border-line rounded-md text-xs"
        >
          {STATES.map((s) => (
            <option key={s || "all"} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      </div>

      {loadState === "error" ? (
        <div role="alert" className="p-5 bg-error-bg border border-error-line text-error rounded-xl text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className={btnSecondary}>Retry</button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-canvas border-b border-line">
              <tr>
                <th className="p-3.5 font-semibold">Sale</th>
                <th className="p-3.5 font-semibold">Discount</th>
                <th className="p-3.5 font-semibold">Pieces</th>
                <th className="p-3.5 font-semibold">Runs</th>
                <th className="p-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loadState === "loading" && items.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-ink-muted" role="status">Loading sales...</td></tr>
              )}
              {loadState === "ready" && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-muted">
                    {query || state ? "No sales match." : "No sales yet. Create the first one with New sale."}
                  </td>
                </tr>
              )}
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-canvas">
                  <td className="p-3.5">
                    <Link href={`/admin/marketing/discounts/${s.id}`} className="font-semibold hover:underline">{s.name}</Link>
                    {s.badgeText && <span className="block text-[11px] text-ink-muted">Badge: {s.badgeText}</span>}
                  </td>
                  <td className="p-3.5">
                    {discountLabel(s)}
                    {s.allowCouponStacking && <span className="block text-[11px] text-ink-muted">Promo codes allowed on top</span>}
                  </td>
                  <td className="p-3.5">{s.productCount}</td>
                  <td className="p-3.5 text-ink-secondary">
                    {formatDateTime(s.startsAt)}
                    <span className="block">to {formatDateTime(s.endsAt)}</span>
                  </td>
                  <td className="p-3.5"><span className={`${badgeClass} ${SALE_STATE_STYLE[s.state]}`}>{s.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
              <span>Page {page} of {totalPages}</span>
              <span className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Next</button>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
