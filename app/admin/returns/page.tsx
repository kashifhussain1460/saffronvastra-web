"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { Pill, reasonLabel, requestBadgeClass, typeLabel, when } from "@/components/admin/payments-shared";

interface RequestRow {
  id: string;
  requestNumber: string;
  orderNumber: string;
  customerName: string;
  type: string;
  status: string;
  reasonCode: string;
  resolution: string;
  outsideWindow: boolean;
  itemsCount: number;
  createdAt: string;
}

const STATUS_TABS = ["All", "Requested", "Approved", "Received", "Completed", "Rejected", "Cancelled"] as const;
const PAGE_SIZE = 20;

export default function AdminReturnsPage() {
  const [status, setStatus] = useState<string>("All");
  const [type, setType] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  // typing in the search box waits a moment before asking the server
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      setLoadState("loading");
      try {
        const q = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (status !== "All") q.set("status", status);
        if (type !== "all") q.set("type", type);
        if (search) q.set("search", search);
        const res = await fetch(`/api/v1/admin/requests?${q}`, { credentials: "include" });
        if (!res.ok) throw new Error("requests");
        const body = await res.json();
        if (signal.cancelled) return;
        setRows(body.data?.items || []);
        setCounts(body.data?.counts || {});
        setPagination({ total: body.data?.pagination?.total ?? 0, totalPages: Math.max(1, body.data?.pagination?.totalPages ?? 1) });
        setLoadState("ready");
      } catch {
        if (!signal.cancelled) setLoadState("error");
      }
    },
    [page, status, type, search]
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load, reloadKey]);

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const countFor = (tab: string) => (tab === "All" ? totalAll : counts[tab] || 0);
  const filtered = status !== "All" || type !== "all" || search !== "";

  const reset = () => {
    setStatus("All");
    setType("all");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Returns &amp; requests</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Cancellation, return and exchange requests from customers. Staff review every request; nothing is refunded automatically.
        </p>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-line" role="tablist" aria-label="Filter requests by status">
        {STATUS_TABS.map((tab) => {
          const active = status === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab);
                setPage(1);
              }}
              className={`pb-3 text-xs whitespace-nowrap transition-all border-b-2 font-medium ${
                active ? "border-primary text-primary font-semibold" : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <span>{tab}</span> <span className="text-[11px]">({countFor(tab)})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-surface p-3.5 rounded-xl border border-line shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Search requests"
            placeholder="Search by request no., order no. or customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-line rounded-md text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-surface border border-line rounded-md text-xs text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">Type: All</option>
            <option value="CANCELLATION">Cancellation</option>
            <option value="RETURN">Return</option>
            <option value="EXCHANGE">Exchange</option>
          </select>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:text-primary-hover font-medium">
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between gap-3">
          <span>The requests could not be loaded.</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" data-testid="requests-table">
            <thead className="bg-canvas text-ink-muted border-b border-line font-medium">
              <tr>
                <th className="p-3.5 font-semibold text-ink">Request</th>
                <th className="p-3.5 font-semibold text-ink">Order</th>
                <th className="p-3.5 font-semibold text-ink">Customer</th>
                <th className="p-3.5 font-semibold text-ink">Type</th>
                <th className="p-3.5 font-semibold text-ink">Reason</th>
                <th className="p-3.5 font-semibold text-ink">Status</th>
                <th className="p-3.5 font-semibold text-ink text-center">Items</th>
                <th className="p-3.5 font-semibold text-ink">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loadState === "loading" && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-muted" role="status">
                    Loading requests...
                  </td>
                </tr>
              )}
              {loadState === "ready" && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-muted">
                    {filtered ? "No requests match these filters." : "No requests have been raised yet."}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-canvas/60 transition-colors" data-testid="request-row">
                  <td className="p-3.5 font-semibold text-primary">
                    <Link href={`/admin/returns/${r.id}`} className="hover:underline">
                      {r.requestNumber}
                    </Link>
                  </td>
                  <td className="p-3.5">
                    <Link href={`/admin/orders/${r.orderNumber}`} className="text-ink hover:underline">
                      #{r.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3.5 text-ink">{r.customerName}</td>
                  <td className="p-3.5 text-ink-secondary">{typeLabel(r.type)}</td>
                  <td className="p-3.5">
                    <p className="text-ink-secondary">{reasonLabel(r.reasonCode)}</p>
                    {r.outsideWindow && (
                      <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border bg-warning-bg text-warning border-warning-line">
                        Outside window
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Pill className={requestBadgeClass(r.status)}>{r.status}</Pill>
                  </td>
                  <td className="p-3.5 text-center text-ink">{r.itemsCount}</td>
                  <td className="p-3.5 text-ink-secondary whitespace-nowrap">{when(r.createdAt, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-muted">
          <p>
            {pagination.total} request{pagination.total === 1 ? "" : "s"}
            {pagination.totalPages > 1 ? ` · page ${page} of ${pagination.totalPages}` : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="w-8 h-8 rounded-sm border border-line flex items-center justify-center text-ink-secondary hover:bg-ink/5 disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="w-8 h-8 rounded-sm border border-line flex items-center justify-center text-ink-secondary hover:bg-ink/5 disabled:opacity-40"
            >
              <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
