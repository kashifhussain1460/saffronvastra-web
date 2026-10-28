"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { api } from "@/lib/adminApi";
import {
  Users,
  Eye,
  Clock,
  ShoppingBag,
  TrendingUp,
  Radio,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  X,
  Compass,
  Sparkles,
} from "lucide-react";

interface AnalyticsSummary {
  timeframe: {
    startDate: string;
    endDate: string;
    days: number;
  };
  metrics: {
    totalVisitors: number;
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    totalCartActions: number;
    avgActiveDurationSeconds: number;
    convertedOrdersCount: number;
    conversionRatePercent: number | null;
  };
  topProducts: Array<{
    productId: string;
    views: number;
    title: string;
    slug: string;
    categoryName: string;
    basePriceMinor: number;
    image: string | null;
  }>;
  orders: {
    ordersCount: number;
    cancelledCount: number;
    revenueMinor: number;
    refundedMinor?: number;
    netRevenueMinor?: number;
    awaitingPaymentCount?: number;
    averageOrderValueMinor: number;
    statusBreakdown: Array<{ status: string; count: number; totalMinor: number }>;
    topSellingProducts: Array<{ slug: string; title: string; unitsSold: number; revenueMinor: number }>;
  };
  popularRoutes: Array<{
    path: string;
    views: number;
  }>;
  eventBreakdown: Array<{
    eventName: string;
    count: number;
  }>;
  dailyTrends: Array<{
    date: string;
    orders: number;
    revenueMinor: number;
  }>;
}

interface SessionItem {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  activeSeconds: number;
  pageViews: number;
  cartActions: number;
  eventsCount: number;
  isConverted: boolean;
  convertedOrderId: string | null;
  visitorType: string;
  identity: string;
  userEmail: string | null;
  tier: string;
}

interface LiveData {
  windowMinutes: number;
  activeVisitorsCount: number;
  recentEvents: Array<{
    id: string;
    eventId: string;
    sessionId: string;
    eventName: string;
    path: string;
    occurredAt: string;
    metadata?: any;
  }>;
}


const money = (minor: number) => "₹" + (minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function AdminAnalyticsDashboard() {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [live, setLive] = useState<LiveData | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState("");

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const [sumRes, liveRes, sessRes] = await Promise.all([
      api(`/api/v1/admin/analytics/summary?days=${periodDays}`),
      api(`/api/v1/admin/analytics/live`),
      api(`/api/v1/admin/analytics/sessions?limit=10&days=${periodDays}`),
    ]);
    setRefreshing(false);
    // Never show partial or stale numbers as if they were current.
    if (!sumRes.ok || !liveRes.ok || !sessRes.ok) {
      setSummary(null);
      setLive(null);
      setSessions([]);
      setErrorMessage((!sumRes.ok ? sumRes : !liveRes.ok ? liveRes : sessRes).message);
      setLoadState("error");
      return;
    }
    setSummary(sumRes.body.data);
    setLive(liveRes.body.data);
    setSessions(sessRes.body.data?.sessions || []);
    setErrorMessage("");
    setLoadState("ready");
  }, [periodDays]);

  useEffect(() => {
    setLoadState("loading");
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  const viewSessionDetail = async (id: string) => {
    setSelectedSessionId(id);
    setLoadingDetail(true);
    setDetailError("");
    setSessionDetail(null);
    const res = await api(`/api/v1/admin/analytics/sessions/${id}`);
    if (res.ok) setSessionDetail(res.body.data);
    else setDetailError(res.message);
    setLoadingDetail(false);
  };

  const formatSeconds = (sec: number) => {
    if (!sec || sec < 60) return `${sec || 0}s`;
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${rem}s`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl md:text-4xl text-ink tracking-tight font-medium">
              Activity & Atelier Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-muted text-secondary border border-line">
              First-Party Engine
            </span>
          </div>
          <p className="text-sm text-ink-secondary mt-1 font-sans">
            Real-time patronage telemetry, active garment engagement, and bespoke order attribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface border border-line rounded-md shadow-sm p-1 text-xs">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                aria-pressed={periodDays === days}
                className={`px-3 py-1.5 rounded transition font-medium ${
                  periodDays === days
                    ? "bg-inverse text-on-inverse"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => void fetchData()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-line text-xs font-medium text-ink rounded-md hover:bg-canvas transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loadState === "error" && (
        <div role="alert" className="p-4 bg-error-bg border border-error-line text-error rounded-md text-sm flex items-center justify-between gap-3">
          <span>The analytics could not be loaded{errorMessage ? ` (${errorMessage})` : ""}. No figures are shown until they can be read from the server.</span>
          <button type="button" className="underline font-semibold shrink-0" onClick={() => { setLoadState("loading"); void fetchData(); }}>
            Try again
          </button>
        </div>
      )}

      {loadState === "loading" && (
        <div role="status" className="py-16 text-center text-sm text-ink-muted flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading analytics...
        </div>
      )}

      {loadState === "ready" && summary && (
      <>
      {/* 2. KPI CARDS: orders (from the orders table) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="order-kpis">
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Sales</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-revenue" data-minor={summary.orders.revenueMinor}>
            {money(summary.orders.revenueMinor)}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            Order totals in the last {periodDays} days. Cancelled orders and online orders still awaiting payment are excluded; refunds are not deducted here.
          </p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Orders</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-orders">
            {summary.orders.ordersCount}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">{summary.orders.cancelledCount} cancelled (not counted)</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Average order value</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-aov">
            {summary.orders.ordersCount > 0 ? money(summary.orders.averageOrderValueMinor) : "—"}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Revenue divided by orders</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Session conversion</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-conversion">
            {summary.metrics.conversionRatePercent === null ? "—" : `${summary.metrics.conversionRatePercent}%`}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">
            {summary.metrics.convertedOrdersCount} of {summary.metrics.totalSessions} sessions ended in an order
          </p>
        </div>
      </div>

      {/* Money received and given back (from the payments and refunds tables) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="payment-kpis">
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Net revenue</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-net-revenue" data-minor={summary.orders.netRevenueMinor ?? 0}>
            {money(summary.orders.netRevenueMinor ?? 0)}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Sales minus those completed refunds</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Refunded</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-refunded" data-minor={summary.orders.refundedMinor ?? 0}>
            {money(summary.orders.refundedMinor ?? 0)}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Completed refunds on orders placed in the last {periodDays} days</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">Awaiting payment</span>
          <div className="mt-2 font-serif text-3xl font-medium text-ink" data-testid="kpi-awaiting-payment">
            {summary.orders.awaitingPaymentCount ?? 0}
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Orders placed in the period that are still Pending (online, not paid yet)</p>
        </div>
      </div>

      {/* Visitor KPIs (from the tracking tables) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="visitor-kpis">
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium uppercase tracking-wider">Visitors</span>
            <span className="p-2 bg-canvas rounded-full text-ink"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 font-serif text-3xl font-medium text-ink">{summary.metrics.totalVisitors}</div>
          <p className="text-[11px] text-ink-muted mt-1">Distinct guests and signed-in customers</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium uppercase tracking-wider">Sessions</span>
            <span className="p-2 bg-canvas rounded-full text-ink"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 font-serif text-3xl font-medium text-ink">{summary.metrics.totalSessions}</div>
          <p className="text-[11px] text-ink-muted mt-1">Tracked storefront sessions</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium uppercase tracking-wider">Page views</span>
            <span className="p-2 bg-canvas rounded-full text-ink"><Eye className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 font-serif text-3xl font-medium text-ink">{summary.metrics.totalPageViews}</div>
          <p className="text-[11px] text-ink-muted mt-1">Recorded page_view events</p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-line shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium uppercase tracking-wider">Avg active time</span>
            <span className="p-2 bg-canvas rounded-full text-ink"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 font-serif text-3xl font-medium text-ink">{formatSeconds(summary.metrics.avgActiveDurationSeconds)}</div>
          <p className="text-[11px] text-ink-muted mt-1">Foreground time per session (heartbeats)</p>
        </div>
      </div>

      {/* 3. LIVE VISITOR PULSE STRIP */}
      <div className="bg-inverse text-on-inverse p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-highlight font-medium block">Live telemetry</span>
            <p className="text-sm font-light text-on-inverse-muted" data-testid="live-count">
              <strong className="font-semibold text-on-primary">{live?.activeVisitorsCount ?? 0} active {live?.activeVisitorsCount === 1 ? "session" : "sessions"}</strong>{" "}
              in the last {live?.windowMinutes ?? 15} minutes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-inverse-muted bg-on-inverse/5 border border-on-inverse/10 px-3 py-1.5 rounded">
          <Radio className="w-3.5 h-3.5 text-highlight" />
          <span>Refreshes every 30 seconds</span>
        </div>
      </div>

      {/* 4. ORDERS: top sellers, status breakdown, daily revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-lg border border-line p-6 shadow-sm">
          <h2 className="font-serif text-xl text-ink font-medium">Best sellers</h2>
          <p className="text-xs text-ink-muted mb-4">Ranked by revenue from non-cancelled orders in this period</p>
          {summary.orders.topSellingProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted" data-testid="no-orders">No orders in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-muted uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 font-medium">Garment</th>
                    <th className="py-2.5 font-medium text-right">Units</th>
                    <th className="py-2.5 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {summary.orders.topSellingProducts.map((p) => (
                    <tr key={p.slug} className="hover:bg-canvas/60 transition">
                      <td className="py-3 font-medium text-ink">{p.title}</td>
                      <td className="py-3 text-right">{p.unitsSold}</td>
                      <td className="py-3 text-right font-medium">{money(p.revenueMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-lg border border-line p-6 shadow-sm">
          <h2 className="font-serif text-xl text-ink font-medium mb-1">Orders by status</h2>
          <p className="text-xs text-ink-muted mb-4">All orders placed in this period</p>
          {summary.orders.statusBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">No orders in this period.</p>
          ) : (
            <ul className="space-y-2 text-xs" data-testid="status-breakdown">
              {summary.orders.statusBreakdown.map((s) => (
                <li key={s.status} className="flex items-center justify-between">
                  <span className="text-ink">{s.status}</span>
                  <span className="text-ink-secondary">{s.count} &middot; {money(s.totalMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(() => {
        const maxRevenue = Math.max(1, ...summary.dailyTrends.map((d) => d.revenueMinor));
        return (
          <div className="bg-surface rounded-lg border border-line p-6 shadow-sm">
            <h2 className="font-serif text-xl text-ink font-medium mb-1">Daily revenue</h2>
            <p className="text-xs text-ink-muted mb-4">Per day (UTC), cancelled orders excluded</p>
            {summary.orders.ordersCount === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">No orders in this period.</p>
            ) : (
              <div className="flex items-end gap-0.5 h-32" role="img" aria-label="Daily revenue bars">
                {summary.dailyTrends.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${money(d.revenueMinor)} from ${d.orders} order(s)`}
                    className="flex-1 bg-primary rounded-t-sm min-h-[2px]"
                    style={{ height: `${Math.max(2, (d.revenueMinor / maxRevenue) * 100)}%`, opacity: d.revenueMinor > 0 ? 1 : 0.2 }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 4b. ENGAGEMENT: most viewed garments and routes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-lg border border-line p-6 shadow-sm">
          <h2 className="font-serif text-xl text-ink font-medium">Most viewed garments</h2>
          <p className="text-xs text-ink-muted mb-4">Ranked by product page views</p>
          {summary.topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted" data-testid="no-product-views">No product views recorded in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-muted uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 font-medium">Garment</th>
                    <th className="py-2.5 font-medium">Category</th>
                    <th className="py-2.5 font-medium">Base Price</th>
                    <th className="py-2.5 font-medium text-right">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {summary.topProducts.map((prod) => (
                    <tr key={prod.productId} className="hover:bg-canvas/60 transition">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-10 h-12 relative bg-canvas rounded overflow-hidden shrink-0 border border-line/80">
                          {prod.image && <Image src={prod.image} alt={prod.title} fill sizes="40px" className="object-cover" />}
                        </div>
                        <span className="font-medium text-ink line-clamp-1">{prod.title}</span>
                      </td>
                      <td className="py-3 text-ink-secondary">{prod.categoryName}</td>
                      <td className="py-3 font-medium text-ink">{money(prod.basePriceMinor)}</td>
                      <td className="py-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-canvas text-ink font-semibold">{prod.views} views</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-lg border border-line p-6 shadow-sm">
          <h2 className="font-serif text-xl text-ink font-medium mb-1">Top visited routes</h2>
          <p className="text-xs text-ink-muted mb-4">Traffic distribution across the storefront</p>
          {summary.popularRoutes.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">No page views recorded in this period.</p>
          ) : (
            <div className="space-y-3">
              {summary.popularRoutes.map((r, i) => (
                <div key={r.path} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 text-ink-muted font-mono">{i + 1}.</span>
                    <span className="font-mono text-ink text-[11px] bg-canvas px-1.5 py-0.5 rounded border border-line truncate">{r.path}</span>
                  </div>
                  <span className="font-medium text-ink-secondary shrink-0">{r.views} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* 5. RECENT VISITOR SESSIONS TABLE */}
      <div className="bg-surface rounded-lg border border-line p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl text-ink font-medium">
              Visitor Sessions & Timeline Drilldown
            </h2>
            <p className="text-xs text-ink-muted">
              Click &quot;View Timeline&quot; to inspect chronological patron actions and journey steps.
            </p>
          </div>
          <span className="text-xs text-ink-muted">Latest {sessions.length} sessions in the last {periodDays} days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-ink-muted uppercase tracking-wider text-[11px]">
                <th className="py-2.5 font-medium">Patron Identity</th>
                <th className="py-2.5 font-medium">Type</th>
                <th className="py-2.5 font-medium">Active Duration</th>
                <th className="py-2.5 font-medium">Views</th>
                <th className="py-2.5 font-medium">Cart Actions</th>
                <th className="py-2.5 font-medium">Status</th>
                <th className="py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-ink-muted">
                    No sessions recorded yet.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-canvas/60 transition">
                    <td className="py-3 font-medium text-ink">
                      <div>{sess.identity}</div>
                      {sess.userEmail && (
                        <div className="text-[11px] text-ink-muted font-normal">{sess.userEmail}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          sess.visitorType === "Registered Customer"
                            ? "bg-surface-muted text-secondary"
                            : "bg-canvas text-ink-secondary border border-line"
                        }`}
                      >
                        {sess.visitorType}
                      </span>
                    </td>
                    <td className="py-3 text-ink font-mono">{formatSeconds(sess.activeSeconds)}</td>
                    <td className="py-3 text-ink-secondary">{sess.pageViews} pages</td>
                    <td className="py-3 text-ink-secondary">{sess.cartActions} actions</td>
                    <td className="py-3">
                      {sess.isConverted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success-bg px-2 py-0.5 rounded border border-success-line">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Converted
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">Browsing</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => viewSessionDetail(sess.id)}
                        className="text-xs text-secondary hover:text-primary-hover font-medium underline"
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SESSION DETAIL MODAL */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-line max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-canvas">
              <div>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Visitor Activity Timeline
                </h3>
                <p className="text-xs text-ink-muted font-mono mt-0.5">Session: {selectedSessionId}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setSessionDetail(null);
                }}
                className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-canvas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {loadingDetail ? (
                <div className="py-12 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  Loading chronological timeline...
                </div>
              ) : sessionDetail ? (
                <>
                  {/* Summary Strip */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-canvas rounded border border-line text-xs">
                    <div>
                      <span className="text-ink-muted block text-[10px] uppercase">Active Duration</span>
                      <strong className="text-ink font-mono">
                        {formatSeconds(sessionDetail.activeSeconds)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px] uppercase">Garments Viewed</span>
                      <strong className="text-ink">{sessionDetail.uniqueProducts} unique</strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px] uppercase">Conversion</span>
                      <strong
                        className={sessionDetail.isConverted ? "text-success" : "text-ink-muted"}
                      >
                        {sessionDetail.isConverted
                          ? `Order #${sessionDetail.convertedOrder?.orderNumber || "Confirmed"}`
                          : "Non-converting"}
                      </strong>
                    </div>
                  </div>

                  {/* Stepper Timeline */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-3">
                      Event Sequence ({sessionDetail.timeline?.length || 0} events)
                    </h4>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-line">
                      {sessionDetail.timeline?.map((evt: any, i: number) => (
                        <div key={i} className="relative flex items-start gap-3 pl-7">
                          <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" />
                          <div className="flex-1 bg-surface p-2.5 rounded border border-line text-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-ink uppercase tracking-wide text-[10px]">
                                {evt.eventName.replace(/_/g, " ")}
                              </span>
                              <span className="text-[10px] text-ink-muted font-mono">
                                +{evt.elapsedSeconds}s
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-ink-secondary mt-1 break-all">
                              {evt.path}
                            </div>
                            {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                              <pre className="mt-1.5 p-1.5 bg-canvas rounded text-[10px] text-ink-secondary overflow-x-auto">
                                {JSON.stringify(evt.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div role="alert" className="py-8 text-center text-xs text-error">{detailError || "No details found."}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
