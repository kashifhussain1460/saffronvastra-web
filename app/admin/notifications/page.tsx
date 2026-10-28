"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, MessageSquare, ShoppingBag } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  metadata: { orderNumber?: string; messageId?: string } | null;
  createdAt: string;
}

const TABS = ["All", "Unread"] as const;

function linkFor(n: AdminNotification): { href: string; label: string } | null {
  if (n.metadata?.orderNumber) return { href: `/admin/orders/${n.metadata.orderNumber}`, label: "View order" };
  if (n.type === "CONTACT_MESSAGE") return { href: "/admin/inbox", label: "Open inbox" };
  return null;
}

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (tab === "Unread") params.set("unread", "true");
    const res = await api(`/api/v1/admin/notifications?${params}`);
    if (!res.ok) {
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setUnreadCount(res.body.unreadCount);
    setLoadState("ready");
  }, [page, tab]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const notifyBell = () => window.dispatchEvent(new Event("admin-notifications-changed"));

  const markRead = async (n: AdminNotification) => {
    if (n.readAt) return;
    setError("");
    const res = await api(`/api/v1/admin/notifications/${n.id}/read`, { method: "PATCH" });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    notifyBell();
  };

  const markAll = async () => {
    setError("");
    const res = await api("/api/v1/admin/notifications/read-all", { method: "POST" });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setUnreadCount(0);
    notifyBell();
    void load();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Notifications</h1>
          <p className="text-xs text-ink-muted mt-0.5">New orders and customer messages as they happen.</p>
        </div>
        <button
          type="button"
          onClick={() => void markAll()}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-40 self-start sm:self-auto"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-ink-secondary" />
          <span>Mark all read</span>
        </button>
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
            {t === "Unread" ? `Unread (${unreadCount})` : t}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>The notifications could not be loaded.</span>
          <button type="button" className="underline font-semibold" onClick={() => { setLoadState("loading"); void load(); }}>
            Try again
          </button>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
        {loadState === "loading" && <p role="status" className="p-6 text-xs text-ink-muted">Loading notifications...</p>}
        {loadState === "ready" && items.length === 0 && (
          <p className="p-8 text-center text-sm text-ink-muted">{tab === "Unread" ? "Nothing unread." : "No notifications yet."}</p>
        )}
        <ul className="divide-y divide-line">
          {items.map((n) => {
            const link = linkFor(n);
            return (
              <li
                key={n.id}
                data-testid="admin-notification"
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 ${!n.readAt ? "bg-surface-muted/25" : ""}`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-warning-bg text-primary">
                    {n.type === "NEW_ORDER" ? <ShoppingBag className="w-4 h-4" /> : n.type === "CONTACT_MESSAGE" ? <MessageSquare className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-semibold text-sm">{n.title}</h3>
                      {!n.readAt && <span aria-label="Unread" className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed">{n.body}</p>
                    <span className="text-[10px] text-ink-muted mt-1.5 block">{formatDateTime(n.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {link && (
                    <Link href={link.href} onClick={() => void markRead(n)} className="px-2.5 py-1 border border-line rounded hover:bg-ink/5 text-xs text-primary font-semibold">
                      {link.label}
                    </Link>
                  )}
                  {!n.readAt && (
                    <button type="button" onClick={() => void markRead(n)} className="px-2.5 py-1 border border-line rounded hover:bg-ink/5 text-xs text-ink-secondary">
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
          <span>{total} {total === 1 ? "notification" : "notifications"}</span>
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
    </div>
  );
}
