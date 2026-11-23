"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Percent, RefreshCw } from "lucide-react";
import { api, formatDay } from "@/lib/adminApi";
import { badgeClass, btnPrimary, btnSecondary, EMAIL_STATUS_STYLE, inr, pct, SALE_STATE_STYLE, type SaleState } from "@/lib/adminMarketing";

interface Dashboard {
  periodDays: number;
  kpis: {
    liveSales: number;
    scheduledSales: number;
    productsOnSale: number;
    saleOrders: number;
    saleUnits: number;
    saleRevenue: number;
    customerSavings: number;
    totalOrders: number;
    totalRevenue: number;
    emailsSent: number;
    emailsFailed: number;
    openRate: number;
    clickRate: number;
    unsubscribes: number;
    emailOrders: number;
    emailRevenue: number;
  };
  daily: Array<{ day: string; revenue: number; orders: number }>;
  campaigns: Array<{ id: string; name: string; state: SaleState; discountType: string; value: number; startsAt: string; endsAt: string; productCount: number; orders: number; units: number; revenue: number; savings: number }>;
  recentEmails: Array<{ id: string; name: string; status: string; sentCount: number; recipientCount: number; createdAt: string; discountCampaign: { name: string } | null }>;
}

const PERIODS = [7, 30, 90, 365];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-serif text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

export default function SalesDashboardPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Dashboard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    const res = await api<{ data: Dashboard }>(`/api/v1/admin/sales/dashboard?days=${days}`);
    if (res.ok && res.body) {
      setData(res.body.data);
      setState("ready");
    } else {
      setError(res.message);
      setState("error");
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const k = data?.kpis;
  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.revenue) ?? [0]));
  const saleShare = k && k.totalRevenue > 0 ? Math.round((k.saleRevenue / k.totalRevenue) * 1000) / 10 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Sales Dashboard</h1>
          <p className="text-xs text-ink-muted mt-0.5">What your sales and sale emails brought in. Cancelled, failed and refunded orders are left out.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="period">Period</label>
          <select id="period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 py-2 bg-surface border border-line rounded-md text-xs">
            {PERIODS.map((p) => (
              <option key={p} value={p}>Last {p} days</option>
            ))}
          </select>
          <button type="button" onClick={() => void load()} className={btnSecondary} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/admin/marketing/discounts" className={btnSecondary}>
            <Percent className="w-4 h-4" /> Discounts
          </Link>
          <Link href="/admin/marketing/email-campaigns" className={btnPrimary}>
            <Mail className="w-4 h-4" /> Email campaigns
          </Link>
        </div>
      </div>

      {state === "error" && (
        <div role="alert" className="p-4 bg-error-bg border border-error-line text-error rounded-xl text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className={btnSecondary}>Retry</button>
        </div>
      )}
      {state === "loading" && !data && <p role="status" className="text-xs text-ink-muted">Loading the dashboard...</p>}

      {k && (
        <>
          <section aria-label="Sales" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Live sales" value={String(k.liveSales)} hint={`${k.scheduledSales} scheduled · ${k.productsOnSale} pieces on sale now`} />
            <Kpi label="Sale revenue" value={inr(k.saleRevenue)} hint={`${saleShare}% of ${inr(k.totalRevenue)} total`} />
            <Kpi label="Orders with sale items" value={String(k.saleOrders)} hint={`${k.saleUnits} pieces sold at sale price`} />
            <Kpi label="Customer savings" value={inr(k.customerSavings)} hint="Given through sale prices" />
          </section>
          <section aria-label="Sale emails" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Sale emails sent" value={String(k.emailsSent)} hint={k.emailsFailed ? `${k.emailsFailed} failed` : "No failures"} />
            <Kpi label="Open rate" value={pct(k.openRate)} hint="Approximate: some mail apps hide opens" />
            <Kpi label="Click rate" value={pct(k.clickRate)} hint={`${k.unsubscribes} unsubscribed`} />
            <Kpi label="Orders from emails" value={String(k.emailOrders)} hint={`${inr(k.emailRevenue)} within 7 days of a click`} />
          </section>

          <section className="bg-surface border border-line rounded-xl p-5">
            <h2 className="font-serif text-lg">Sale revenue by day</h2>
            {data!.daily.length === 0 ? (
              <p className="text-xs text-ink-muted mt-3">No sale orders in this period yet.</p>
            ) : (
              <div className="mt-4 flex items-stretch gap-1 h-40" role="img" aria-label="Sale revenue per day">
                {data!.daily.map((d) => (
                  <div key={d.day} className="flex-1 min-w-[6px] max-w-[48px] flex flex-col justify-end" title={`${formatDay(d.day)}: ${inr(d.revenue)}, ${d.orders} order(s)`}>
                    <div className="bg-primary/80 rounded-t" style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 100)}%` }} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-surface border border-line rounded-xl overflow-x-auto">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h2 className="font-serif text-lg">Sales performance</h2>
              <Link href="/admin/marketing/discounts/new" className="text-xs font-semibold underline">New sale</Link>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas border-b border-line">
                <tr>
                  <th className="p-3 font-semibold">Sale</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Dates</th>
                  <th className="p-3 font-semibold text-right">Orders</th>
                  <th className="p-3 font-semibold text-right">Pieces</th>
                  <th className="p-3 font-semibold text-right">Revenue</th>
                  <th className="p-3 font-semibold text-right">Savings given</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data!.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-ink-muted">No sales in this period. Create one under Discounts.</td>
                  </tr>
                )}
                {data!.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3">
                      <Link href={`/admin/marketing/discounts/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                      <span className="block text-[11px] text-ink-muted">
                        {c.discountType === "PERCENTAGE" ? `${c.value}% off` : `${inr(c.value)} off`} · {c.productCount} piece(s)
                      </span>
                    </td>
                    <td className="p-3"><span className={`${badgeClass} ${SALE_STATE_STYLE[c.state]}`}>{c.state}</span></td>
                    <td className="p-3 text-ink-secondary">{formatDay(c.startsAt)} – {formatDay(c.endsAt)}</td>
                    <td className="p-3 text-right">{c.orders}</td>
                    <td className="p-3 text-right">{c.units}</td>
                    <td className="p-3 text-right font-semibold">{inr(c.revenue)}</td>
                    <td className="p-3 text-right">{inr(c.savings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-surface border border-line rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Recent sale emails</h2>
              <Link href="/admin/marketing/email-campaigns" className="text-xs font-semibold underline">All emails</Link>
            </div>
            {data!.recentEmails.length === 0 ? (
              <p className="text-xs text-ink-muted mt-3">No sale emails yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line text-xs">
                {data!.recentEmails.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                    <Link href={`/admin/marketing/email-campaigns/${e.id}`} className="font-semibold hover:underline">
                      {e.name}
                      {e.discountCampaign && <span className="font-normal text-ink-muted"> · {e.discountCampaign.name}</span>}
                    </Link>
                    <span className="flex items-center gap-3">
                      <span className="text-ink-muted">{e.sentCount}/{e.recipientCount} sent</span>
                      <span className={`${badgeClass} ${EMAIL_STATUS_STYLE[e.status] || ""}`}>{e.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
