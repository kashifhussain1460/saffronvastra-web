"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";
import { badgeClass, btnPrimary, btnSecondary, EMAIL_STATUS_STYLE, inr, SEGMENT_LABELS, type EmailCampaign, type EmailStatus } from "@/lib/adminMarketing";

const STATUSES: Array<EmailStatus | ""> = ["", "Draft", "Scheduled", "Sending", "Completed", "Cancelled"];
const rate = (part = 0, whole = 0) => (whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "–");

export default function EmailCampaignsPage() {
  const [items, setItems] = useState<EmailCampaign[]>([]);
  const [status, setStatus] = useState<EmailStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    const res = await api<{ data: EmailCampaign[]; pagination: { totalPages: number } }>(`/api/v1/admin/email-campaigns?${params}`);
    if (res.ok && res.body) {
      setItems(res.body.data);
      setTotalPages(res.body.pagination.totalPages);
      setLoadState("ready");
    } else {
      setError(res.message);
      setLoadState("error");
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  // keep the progress of a running send fresh
  useEffect(() => {
    if (!items.some((i) => i.status === "Sending")) return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [items, load]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Email Campaigns</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Sale alerts to customers who favourited a piece or left it in their bag, and agreed to offers by email.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/marketing/sales" className={btnSecondary}>
            <BarChart3 className="w-4 h-4" /> Sales dashboard
          </Link>
          <Link href="/admin/marketing/email-campaigns/new" className={btnPrimary}>
            <Plus className="w-4 h-4" /> New sale email
          </Link>
        </div>
      </div>

      <div>
        <label htmlFor="ec-status" className="sr-only">Status</label>
        <select
          id="ec-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EmailStatus | "");
            setPage(1);
          }}
          className="px-3 py-2 bg-surface border border-line rounded-md text-xs"
        >
          {STATUSES.map((s) => (
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
                <th className="p-3.5 font-semibold">Email</th>
                <th className="p-3.5 font-semibold">Audience</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-right">Sent</th>
                <th className="p-3.5 font-semibold text-right">Opened</th>
                <th className="p-3.5 font-semibold text-right">Clicked</th>
                <th className="p-3.5 font-semibold text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loadState === "loading" && items.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-ink-muted" role="status">Loading emails...</td></tr>
              )}
              {loadState === "ready" && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    {status ? "No emails match." : "No sale emails yet. Switch a sale on, then create its email here."}
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-canvas">
                  <td className="p-3.5">
                    <Link href={`/admin/marketing/email-campaigns/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                    <span className="block text-[11px] text-ink-muted">
                      {c.discountCampaign?.name || "No sale"} · {formatDateTime(c.startedAt || c.scheduledAt || c.createdAt)}
                    </span>
                  </td>
                  <td className="p-3.5">{SEGMENT_LABELS[c.segment]}</td>
                  <td className="p-3.5"><span className={`${badgeClass} ${EMAIL_STATUS_STYLE[c.status] || ""}`}>{c.status}</span></td>
                  <td className="p-3.5 text-right">{c.sentCount}/{c.recipientCount}</td>
                  <td className="p-3.5 text-right">{rate(c.opened, c.sentCount)}</td>
                  <td className="p-3.5 text-right">{rate(c.clicked, c.sentCount)}</td>
                  <td className="p-3.5 text-right">
                    {c.orders ?? 0}
                    {(c.revenue ?? 0) > 0 && <span className="block text-[11px] text-ink-muted">{inr(c.revenue)}</span>}
                  </td>
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
