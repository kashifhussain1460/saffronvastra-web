"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, Search, CheckCircle2, ExternalLink } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  orderNumber: string | null;
  status: "New" | "Read" | "Resolved";
  replyText: string | null;
  repliedAt: string | null;
  createdAt: string;
}

const TABS = ["All", "New", "Read", "Resolved"] as const;

export default function AdminInboxPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Message[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (tab !== "All") params.set("status", tab);
    if (query) params.set("search", query);
    const res = await api(`/api/v1/admin/engagement/contact-messages?${params}`);
    if (!res.ok) {
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [page, tab, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const selected = items.find((m) => m.id === selectedId) || null;

  const setStatus = async (message: Message, status: Message["status"]) => {
    setError("");
    const res = await api(`/api/v1/admin/engagement/contact-messages/${message.id}`, { method: "PATCH", json: { status } });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setItems((prev) => prev.map((m) => (m.id === message.id ? { ...m, status } : m)));
  };

  // Opening a new message marks it read.
  const open = async (message: Message) => {
    setSelectedId(message.id);
    setReply("");
    setError("");
    setNotice("");
    if (message.status === "New") await setStatus(message, "Read");
  };

  const sendReply = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const res = await api(`/api/v1/admin/engagement/contact-messages/${selected.id}/reply`, { method: "POST", json: { reply } });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setItems((prev) => prev.map((m) => (m.id === selected.id ? res.body.data : m)));
    setReply("");
    setNotice(
      res.body.email?.status === "Skipped"
        ? "Reply saved and the message is resolved. No email provider is configured, so the email was recorded but not delivered."
        : "Reply sent and the message is resolved."
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Inbox</h1>
        <p className="text-xs text-ink-muted mt-0.5">Messages from the contact page and from customers asking about an order.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            aria-pressed={tab === t}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              tab === t ? "bg-primary text-on-primary border-primary" : "bg-surface text-ink border-line hover:bg-ink/5"
            }`}
          >
            {t}
          </button>
        ))}
        <form
          className="ml-auto relative"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search messages"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, topic, order..."
            className="pl-8 pr-3 py-2 bg-surface border border-line rounded-md text-xs w-64 focus:outline-none focus:border-primary"
          />
        </form>
      </div>

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>The messages could not be loaded.</span>
          <button type="button" className="underline font-semibold" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
          {loadState === "loading" && <p role="status" className="p-6 text-xs text-ink-muted">Loading messages...</p>}
          {loadState === "ready" && items.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-muted">{query || tab !== "All" ? "No messages match." : "No messages yet."}</p>
          )}
          <ul className="divide-y divide-line">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => void open(m)}
                  aria-current={selectedId === m.id}
                  className={`w-full text-left p-4 hover:bg-canvas ${selectedId === m.id ? "bg-surface-muted" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${m.status === "New" ? "font-bold" : "font-medium"} text-ink truncate`}>{m.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        m.status === "New"
                          ? "bg-warning-bg border-warning-line text-warning"
                          : m.status === "Resolved"
                          ? "bg-success-bg border-success-line text-success"
                          : "bg-surface-muted border-line text-ink-secondary"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                    {m.subject || "No topic"}
                    {m.orderNumber ? ` · Order ${m.orderNumber}` : ""}
                  </p>
                  <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{m.message}</p>
                  <p className="text-[10px] text-ink-muted mt-1">{formatDateTime(m.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
            <span>{total} {total === 1 ? "message" : "messages"}</span>
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

        {/* Detail */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-line shadow-2xs p-6 min-h-[320px]">
          {!selected ? (
            <p className="text-sm text-ink-muted">Select a message to read it and reply.</p>
          ) : (
            <div className="space-y-5" data-testid="message-detail">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-ink">{selected.name}</h2>
                  <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-3 flex-wrap">
                    <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 hover:text-primary-hover">
                      <Mail className="w-3 h-3" /> {selected.email}
                    </a>
                    {selected.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selected.phone}
                      </span>
                    )}
                    <span>{formatDateTime(selected.createdAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status !== "Resolved" ? (
                    <button type="button" onClick={() => void setStatus(selected, "Resolved")} className="px-3 py-1.5 text-xs font-semibold border border-success-line bg-success-bg text-success rounded-md hover:bg-success-bg">
                      Mark resolved
                    </button>
                  ) : (
                    <button type="button" onClick={() => void setStatus(selected, "Read")} className="px-3 py-1.5 text-xs font-semibold border border-line rounded-md hover:bg-ink/5">
                      Reopen
                    </button>
                  )}
                  {selected.status === "Read" && (
                    <button type="button" onClick={() => void setStatus(selected, "New")} className="px-3 py-1.5 text-xs font-semibold border border-line rounded-md hover:bg-ink/5">
                      Mark unread
                    </button>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-ink-muted">Topic</dt>
                  <dd className="text-ink mt-0.5">{selected.subject || "Not given"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Order</dt>
                  <dd className="mt-0.5">
                    {selected.orderNumber ? (
                      <Link href={`/admin/orders/${selected.orderNumber}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        {selected.orderNumber} <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      "None"
                    )}
                  </dd>
                </div>
              </dl>

              <div className="p-4 bg-canvas border border-line rounded-md text-sm text-ink whitespace-pre-wrap">{selected.message}</div>

              {selected.replyText && (
                <div className="p-4 bg-success-bg/60 border border-success-line rounded-md text-sm text-ink whitespace-pre-wrap">
                  <p className="text-[11px] font-semibold text-success mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Your reply, {formatDateTime(selected.repliedAt)}
                  </p>
                  {selected.replyText}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="reply" className="text-xs font-semibold text-ink block">
                  {selected.replyText ? "Send another reply" : "Reply by email"}
                </label>
                <textarea
                  id="reply"
                  rows={5}
                  maxLength={5000}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Write to ${selected.name}...`}
                  className="w-full p-3 border border-line rounded-md text-sm bg-surface focus:outline-none focus:border-primary"
                />
                {error && (
                  <p role="alert" className="text-xs text-error">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="text-xs text-success">
                    {notice}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void sendReply()}
                  disabled={busy || reply.trim().length < 2}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-hover disabled:opacity-50"
                >
                  {busy ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
