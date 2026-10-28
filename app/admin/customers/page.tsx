"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, ShoppingBag, ExternalLink, X } from "lucide-react";
import { api, formatDay, formatDateTime } from "@/lib/adminApi";

interface Customer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  tier: string;
  status: string;
  ordersCount: number;
  totalSpentMinor: number;
  lastOrderDate: string | null;
  createdAt: string;
}

interface CustomerDetail extends Customer {
  emailVerified: boolean;
  newsletter: string;
  addresses: {
    id: string;
    fullName: string;
    phone: string;
    street: string;
    apartment: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault: boolean;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalMinor: number;
    currency: string;
    itemCount: number;
    createdAt: string;
  }[];
}

const TIERS = ["Atelier VIP", "Royal Patron", "Circle Member"];
const STATUSES = ["ACTIVE", "SUSPENDED", "DELETED"];
const PAGE_SIZE = 15;

const money = (minor: number) => `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;

export default function AdminCustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailState, setDetailState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (query) params.set("q", query);
    if (tier) params.set("tier", tier);
    if (status) params.set("status", status);
    const res = await api(`/api/v1/admin/customers?${params}`);
    if (!res.ok || !Array.isArray(res.body?.items)) {
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [page, query, tier, status]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailState("loading");
    const res = await api(`/api/v1/admin/customers/${id}`);
    if (!res.ok || !res.body?.data) {
      setDetailState("error");
      return;
    }
    setDetail(res.body.data);
    setDetailState("ready");
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setDetail(null);
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setTier("");
    setStatus("");
    setPage(1);
  };

  const filtered = !!(query || tier || status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Customers</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Registered customers with their order count and lifetime spend. Cancelled orders are not counted towards spend.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form
          className="relative w-full sm:w-80"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search name, email or phone, then press Enter"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-md placeholder:text-ink-muted focus:outline-none focus:border-primary"
            aria-label="Search customers"
          />
        </form>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by tier"
            className="px-3 py-2 bg-surface border border-line rounded-md focus:outline-none focus:border-primary"
          >
            <option value="">Tier: All</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="px-3 py-2 bg-surface border border-line rounded-md focus:outline-none focus:border-primary"
          >
            <option value="">Status: All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button type="button" onClick={resetFilters} className="px-3 py-2 text-primary hover:text-primary-hover font-semibold">
            Reset
          </button>
        </div>
      </div>

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>The customers could not be loaded.</span>
          <button
            type="button"
            className="underline font-semibold"
            onClick={() => {
              setLoadState("loading");
              void load();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas border-b border-line text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Tier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Orders</th>
                <th className="p-3.5">Lifetime spend</th>
                <th className="p-3.5">Last order</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loadState === "loading" && (
                <tr>
                  <td colSpan={8} role="status" className="p-12 text-center text-ink-muted">
                    Loading customers...
                  </td>
                </tr>
              )}
              {loadState === "ready" && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-ink-muted">
                    <Users className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="font-serif text-base text-ink">{filtered ? "No customers match" : "No customers yet"}</p>
                    <p className="text-xs mt-1">{filtered ? "Try changing the search or filters." : "Customers appear here once they register."}</p>
                  </td>
                </tr>
              )}
              {loadState === "ready" &&
                items.map((c) => (
                  <tr key={c.id} data-testid="customer-row" className="hover:bg-canvas/60 transition-colors">
                    <td className="p-3.5">
                      <span className="font-serif font-medium text-sm text-ink block">{c.displayName}</span>
                      <span className="text-[11px] text-ink-muted block">{c.email}</span>
                      {c.phone && <span className="text-[10px] text-ink-muted block">{c.phone}</span>}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">{c.tier}</td>
                    <td className="p-3.5 whitespace-nowrap">{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</td>
                    <td className="p-3.5 whitespace-nowrap font-semibold">{c.ordersCount}</td>
                    <td className="p-3.5 whitespace-nowrap font-semibold text-sm">{money(c.totalSpentMinor)}</td>
                    <td className="p-3.5 whitespace-nowrap text-ink-muted">{c.lastOrderDate ? formatDay(c.lastOrderDate) : "No orders"}</td>
                    <td className="p-3.5 whitespace-nowrap text-ink-muted">{formatDay(c.createdAt)}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className="px-2.5 py-1 border border-line rounded hover:bg-ink/5 text-xs font-semibold text-primary"
                        aria-label={`View ${c.displayName}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-canvas border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <p>
            {total} {total === 1 ? "customer" : "customers"}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">
              Previous
            </button>
            <span className="font-semibold text-ink px-2">
              Page {page} of {totalPages}
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={() => setSelectedId(null)}>
          <aside
            role="dialog"
            aria-label="Customer details"
            aria-modal="true"
            data-testid="customer-detail"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full overflow-y-auto bg-surface border-l border-line p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-xl">{detail?.displayName || "Customer"}</h2>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="p-1 hover:bg-ink/5 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailState === "loading" && <p role="status" className="text-xs text-ink-muted">Loading customer...</p>}
            {detailState === "error" && (
              <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
                <span>This customer could not be loaded.</span>
                <button type="button" className="underline font-semibold" onClick={() => void loadDetail(selectedId)}>
                  Try again
                </button>
              </div>
            )}

            {detailState === "ready" && detail && (
              <>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <dt className="text-ink-muted">Email</dt>
                    <dd className="mt-0.5">
                      {detail.email} {detail.emailVerified ? "(verified)" : "(not verified)"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Phone</dt>
                    <dd className="mt-0.5">{detail.phone || "Not given"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Account status</dt>
                    <dd className="mt-0.5">{detail.status.charAt(0) + detail.status.slice(1).toLowerCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Orders</dt>
                    <dd className="mt-0.5 font-semibold">{detail.ordersCount}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Lifetime spend</dt>
                    <dd className="mt-0.5 font-semibold">{money(detail.totalSpentMinor)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Joined</dt>
                    <dd className="mt-0.5">{formatDay(detail.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Newsletter</dt>
                    <dd className="mt-0.5" data-testid="customer-newsletter">{detail.newsletter}</dd>
                  </div>
                </dl>

                <section aria-label="Orders">
                  <h3 className="font-serif text-base mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-primary" /> Orders
                  </h3>
                  {detail.orders.length === 0 ? (
                    <p className="text-xs text-ink-muted">This customer has not placed an order.</p>
                  ) : (
                    <ul className="divide-y divide-line border border-line rounded-md">
                      {detail.orders.map((o) => (
                        <li key={o.id} className="p-3 text-xs flex items-center justify-between gap-3">
                          <div>
                            <Link href={`/admin/orders/${o.orderNumber}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                              {o.orderNumber} <ExternalLink className="w-3 h-3" />
                            </Link>
                            <p className="text-ink-muted mt-0.5">
                              {formatDateTime(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{money(o.totalMinor)}</p>
                            <p className="text-ink-muted">
                              {o.status} · {o.paymentStatus}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-label="Addresses">
                  <h3 className="font-serif text-base mb-2">Addresses</h3>
                  {detail.addresses.length === 0 ? (
                    <p className="text-xs text-ink-muted">No saved addresses.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.addresses.map((a) => (
                        <li key={a.id} className="p-3 border border-line rounded-md text-xs bg-canvas">
                          <p className="font-semibold">
                            {a.fullName} {a.isDefault && <span className="text-primary">(default)</span>}
                          </p>
                          <p className="text-ink-secondary">
                            {[a.street, a.apartment, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", ")}
                          </p>
                          <p className="text-ink-muted">{a.phone}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
