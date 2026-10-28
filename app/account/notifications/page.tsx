"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, Truck, MailCheck, ChevronLeft, ChevronRight } from "lucide-react";
import AccountShell from "@/components/account/AccountShell";
import { btnSmall, btnSmallOutline, sectionTitle } from "@/components/auth/ui";
import { api, formatDateTime } from "@/lib/adminApi";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  metadata: { orderNumber?: string; event?: string } | null;
  createdAt: string;
}

const TABS = ["All", "Unread", "Orders"] as const;
const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (activeTab === "Unread") params.set("unread", "true");
    const res = await api(`/api/v1/me/notifications?${params}`);
    if (!res.ok) {
      setErrorMessage(res.status === 401 ? "Please sign in to see your notifications." : "Your notifications could not be loaded.");
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setUnreadCount(res.body.unreadCount);
    setLoadState("ready");
  }, [page, activeTab]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const visible = activeTab === "Orders" ? items.filter((n) => n.type === "ORDER_UPDATE") : items;

  const markRead = async (item: NotificationItem) => {
    if (item.readAt) return;
    setActionError("");
    const res = await api(`/api/v1/me/notifications/${item.id}/read`, { method: "PATCH" });
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    setActionError("");
    const res = await api("/api/v1/me/notifications/read-all", { method: "POST" });
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setUnreadCount(0);
    void load();
  };

  return (
    <AccountShell
      title="Notifications"
      crumbs={[{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: "Notifications" }]}
      active="notifications"
    >
      <div className="space-y-5">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>
            All Notifications{" "}
            <span className="text-ink-muted font-sans text-base font-normal" data-testid="notif-unread">
              ({unreadCount} unread)
            </span>
          </h2>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
            className={btnSmallOutline}
          >
            <MailCheck className="w-4 h-4" aria-hidden="true" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-6 sm:gap-8 border-b border-line overflow-x-auto scrollbar-none" role="group" aria-label="Filter notifications">
          {TABS.map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`relative min-h-[44px] pb-2 whitespace-nowrap text-base font-medium transition-colors ${
                  selected ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab}
                {selected && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-ink" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {actionError && (
          <p role="alert" className="text-sm text-error">
            {actionError}
          </p>
        )}

        {loadState === "error" && (
          <div role="alert" className="rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error flex flex-wrap items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <span className="flex gap-4">
              <button
                type="button"
                className="underline font-semibold min-h-[44px]"
                onClick={() => {
                  setLoadState("loading");
                  void load();
                }}
              >
                Try again
              </button>
              <Link href="/auth/login" className="underline font-semibold min-h-[44px] inline-flex items-center">
                Sign in
              </Link>
            </span>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {loadState === "loading" && (
            <p role="status" className="py-6 text-base text-ink-muted">
              Loading notifications...
            </p>
          )}
          {loadState === "ready" && visible.length === 0 && (
            <div className="rounded-2xl border border-line p-8 text-center space-y-2">
              <Bell className="w-10 h-10 mx-auto text-ink-muted" strokeWidth={1.25} aria-hidden="true" />
              <p className="font-heading text-xl font-medium text-ink">
                {activeTab === "All" ? "No notifications yet" : `No ${activeTab.toLowerCase()} notifications`}
              </p>
              <p className="text-base text-ink-secondary">Updates about your orders will appear here.</p>
            </div>
          )}
          {loadState === "ready" &&
            visible.map((item) => (
              <div
                key={item.id}
                data-testid="notification-item"
                className={`rounded-2xl border p-4 sm:p-5 transition-colors ${item.readAt ? "border-line" : "border-ink"}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-11 h-11 rounded-full bg-surface-muted shrink-0 flex items-center justify-center text-ink">
                    {item.metadata?.event === "shipped" ? (
                      <Truck className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-ink leading-snug">{item.title}</h3>
                      {!item.readAt && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary">
                          <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-base text-ink-secondary leading-relaxed">{item.body}</p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-ink-muted">{formatDateTime(item.createdAt)}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        {!item.readAt && (
                          <button type="button" onClick={() => void markRead(item)} className={btnSmallOutline}>
                            Mark as read
                          </button>
                        )}
                        {item.metadata?.orderNumber && (
                          <Link
                            href={`/account/orders/${item.metadata.orderNumber}`}
                            onClick={() => void markRead(item)}
                            className={btnSmall}
                          >
                            View Order
                          </Link>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        <nav aria-label="Notification pages" className="pt-4 flex items-center justify-center gap-3 text-base text-ink-secondary">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-ink hover:border-ink disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {page} of {totalPages} ({total})
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-ink hover:border-ink disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </AccountShell>
  );
}
