"use client";

import { BRAND } from "@/lib/brand";
import React, { useCallback, useEffect, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { api, formatDateTime, formatDay } from "@/lib/adminApi";

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  status: "Subscribed" | "Unsubscribed";
  unsubscribedAt: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  preheader: string | null;
  body: string;
  status: "Draft" | "Sending" | "Sent";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
}

const EMPTY_DRAFT = { id: "", subject: "", preheader: "", body: "" };

export default function AdminNewsletterPage() {
  const [tab, setTab] = useState<"subscribers" | "newsletters">("subscribers");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Newsletter</h1>
        <p className="text-xs text-ink-muted mt-0.5">The Saffron Circle: who has joined, and the newsletters you send them.</p>
      </div>
      <div role="tablist" className="flex gap-2 border-b border-line">
        {(["subscribers", "newsletters"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t === "subscribers" ? "Subscribers" : "Newsletters"}
          </button>
        ))}
      </div>
      {tab === "subscribers" ? <SubscribersTab /> : <NewslettersTab />}
    </div>
  );
}

function SubscribersTab() {
  const [status, setStatus] = useState<"" | "Subscribed" | "Unsubscribed">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ subscribed: 0, unsubscribed: 0 });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (status) params.set("status", status);
    if (query) params.set("search", query);
    const [list, summary] = await Promise.all([
      api(`/api/v1/admin/engagement/newsletter-subscribers?${params}`),
      api("/api/v1/admin/engagement/summary"),
    ]);
    if (!list.ok) {
      setLoadState("error");
      return;
    }
    setItems(list.body.items);
    setTotal(list.body.pagination.total);
    setTotalPages(list.body.pagination.totalPages || 1);
    if (summary.ok) setCounts({ subscribed: summary.body.data.subscribed, unsubscribed: summary.body.data.unsubscribed });
    setLoadState("ready");
  }, [page, status, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const change = async (sub: Subscriber, next: Subscriber["status"]) => {
    setError("");
    const res = await api(`/api/v1/admin/engagement/newsletter-subscribers/${sub.id}`, { method: "PATCH", json: { status: next } });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    await load();
  };

  // Everyone who matches the current filter, as a CSV file.
  const exportCsv = async () => {
    const all: Subscriber[] = [];
    for (let p = 1; p <= 100; p++) {
      const params = new URLSearchParams({ page: String(p), limit: "100" });
      if (status) params.set("status", status);
      if (query) params.set("search", query);
      const res = await api(`/api/v1/admin/engagement/newsletter-subscribers?${params}`);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      all.push(...res.body.items);
      if (p >= res.body.pagination.totalPages) break;
    }
    const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Email", "Status", "Source", "Joined", "Unsubscribed"], ...all.map((s) => [s.email, s.status, s.source || "", formatDay(s.createdAt), formatDay(s.unsubscribedAt)])];
    const csv = rows.map((r) => r.map(quote).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-line">
          <p className="text-xs text-ink-muted">Subscribed</p>
          <p data-testid="count-subscribed" className="text-2xl font-serif text-ink mt-1">{counts.subscribed}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line">
          <p className="text-xs text-ink-muted">Unsubscribed</p>
          <p data-testid="count-unsubscribed" className="text-2xl font-serif text-ink mt-1">{counts.unsubscribed}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          className="px-3 py-2 bg-surface border border-line rounded-md text-xs"
        >
          <option value="">Status: All</option>
          <option value="Subscribed">Subscribed</option>
          <option value="Unsubscribed">Unsubscribed</option>
        </select>
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search subscribers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email..."
            className="pl-8 pr-3 py-2 bg-surface border border-line rounded-md text-xs w-64 focus:outline-none focus:border-primary"
          />
        </form>
        <button type="button" onClick={() => void exportCsv()} className="ml-auto inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold hover:bg-ink/5">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {(error || loadState === "error") && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
          {error || "The subscribers could not be loaded."}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas border-b border-line text-ink">
            <tr>
              <th className="p-3.5 font-semibold">Email</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 font-semibold">Joined from</th>
              <th className="p-3.5 font-semibold">Joined</th>
              <th className="p-3.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loadState === "loading" && (
              <tr>
                <td colSpan={5} className="p-6 text-ink-muted" role="status">Loading subscribers...</td>
              </tr>
            )}
            {loadState === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-muted">No subscribers match.</td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td className="p-3.5 text-ink">{s.email}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${s.status === "Subscribed" ? "bg-success-bg border-success-line text-success" : "bg-surface-muted border-line text-ink-secondary"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3.5 text-ink-secondary">{s.source || "—"}</td>
                <td className="p-3.5 text-ink-secondary">{formatDay(s.createdAt)}</td>
                <td className="p-3.5 text-right">
                  {s.status === "Subscribed" ? (
                    <button type="button" aria-label={`Unsubscribe ${s.email}`} onClick={() => void change(s, "Unsubscribed")} className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-error-bg hover:text-error">
                      Unsubscribe
                    </button>
                  ) : (
                    <button type="button" aria-label={`Resubscribe ${s.email}`} onClick={() => void change(s, "Subscribed")} className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-success-bg hover:text-success">
                      Resubscribe
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
          <span>{total} {total === 1 ? "subscriber" : "subscribers"}</span>
          <span className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Previous</button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Next</button>
          </span>
        </div>
      </div>
    </div>
  );
}

function NewslettersTab() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [composing, setComposing] = useState(false);
  const [subscribed, setSubscribed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [list, summary] = await Promise.all([api("/api/v1/admin/engagement/newsletter-campaigns?limit=50"), api("/api/v1/admin/engagement/summary")]);
    if (!list.ok) {
      setLoadState("error");
      return;
    }
    setItems(list.body.items);
    if (summary.ok) setSubscribed(summary.body.data.subscribed);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (): Promise<Campaign | null> => {
    setError("");
    const payload = { subject: draft.subject, preheader: draft.preheader || null, body: draft.body };
    const res = draft.id
      ? await api(`/api/v1/admin/engagement/newsletter-campaigns/${draft.id}`, { method: "PATCH", json: payload })
      : await api("/api/v1/admin/engagement/newsletter-campaigns", { method: "POST", json: payload });
    if (!res.ok) {
      setError(res.message);
      return null;
    }
    setDraft({ id: res.body.data.id, subject: res.body.data.subject, preheader: res.body.data.preheader || "", body: res.body.data.body });
    await load();
    return res.body.data;
  };

  const saveDraft = async () => {
    setBusy(true);
    setNotice("");
    const saved = await save();
    setBusy(false);
    if (saved) setNotice("Draft saved.");
  };

  const sendTest = async () => {
    setBusy(true);
    setNotice("");
    const saved = await save();
    if (saved) {
      const res = await api(`/api/v1/admin/engagement/newsletter-campaigns/${saved.id}/test`, { method: "POST", json: {} });
      if (!res.ok) setError(res.message);
      else setNotice(res.body.data?.status === "Skipped" ? "Test recorded in the email log. No email provider is configured, so it was not delivered." : "Test email sent to you.");
    }
    setBusy(false);
  };

  const send = async () => {
    if (!window.confirm(`Send "${draft.subject}" to ${subscribed} ${subscribed === 1 ? "subscriber" : "subscribers"}? This cannot be undone.`)) return;
    setBusy(true);
    setNotice("");
    const saved = await save();
    if (saved) {
      const res = await api(`/api/v1/admin/engagement/newsletter-campaigns/${saved.id}/send`, { method: "POST" });
      if (!res.ok) setError(res.message);
      else {
        const skipped = res.body.skippedCount || 0;
        setNotice(
          skipped > 0
            ? `Sent to ${res.body.data.recipientCount} subscribers: ${res.body.data.sentCount} delivered, ${skipped} recorded but not delivered (no email provider is configured), ${res.body.data.failedCount} failed.`
            : `Sent to ${res.body.data.recipientCount} subscribers: ${res.body.data.sentCount} delivered, ${res.body.data.failedCount} failed.`
        );
        setDraft(EMPTY_DRAFT);
        setComposing(false);
        await load();
      }
    }
    setBusy(false);
  };

  const remove = async (c: Campaign) => {
    if (!window.confirm(`Delete the draft "${c.subject}"?`)) return;
    const res = await api(`/api/v1/admin/engagement/newsletter-campaigns/${c.id}`, { method: "DELETE" });
    if (!res.ok) setError(res.message);
    else await load();
  };

  return (
    <div className="space-y-5">
      {!composing && (
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setComposing(true);
            setError("");
            setNotice("");
          }}
          className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-hover"
        >
          New newsletter
        </button>
      )}

      {notice && !composing && (
        <p role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs">
          {notice}
        </p>
      )}

      {composing && (
        <div className="bg-surface p-6 rounded-xl border border-line space-y-4" aria-label="Compose newsletter" role="form">
          <h2 className="font-serif text-xl text-ink">{draft.id ? "Edit draft" : "New newsletter"}</h2>
          <label className="block text-xs">
            <span className="font-semibold text-ink">Subject</span>
            <input
              type="text"
              maxLength={150}
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              className="mt-1 w-full p-2.5 border border-line rounded-md bg-canvas"
            />
          </label>
          <label className="block text-xs">
            <span className="font-semibold text-ink">Preview text (optional)</span>
            <input
              type="text"
              maxLength={150}
              value={draft.preheader}
              onChange={(e) => setDraft({ ...draft, preheader: e.target.value })}
              className="mt-1 w-full p-2.5 border border-line rounded-md bg-canvas"
            />
          </label>
          <label className="block text-xs">
            <span className="font-semibold text-ink">Message</span>
            <textarea
              rows={9}
              maxLength={10000}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder={"Write in plain paragraphs. A blank line starts a new paragraph, and web addresses become links."}
              className="mt-1 w-full p-3 border border-line rounded-md bg-canvas leading-relaxed"
            />
          </label>
          <p className="text-[11px] text-ink-muted">Every copy is sent in the {BRAND.name} design with a link to unsubscribe.</p>
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
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void saveDraft()} disabled={busy} className="px-4 py-2 border border-line text-xs font-semibold rounded-md hover:bg-ink/5 disabled:opacity-50">
              Save draft
            </button>
            <button type="button" onClick={() => void sendTest()} disabled={busy} className="px-4 py-2 border border-primary text-primary text-xs font-semibold rounded-md hover:bg-primary-hover hover:text-on-primary disabled:opacity-50">
              Send test to me
            </button>
            <button type="button" onClick={() => void send()} disabled={busy} className="px-4 py-2 bg-inverse-hover text-on-primary text-xs font-semibold rounded-md hover:bg-inverse disabled:opacity-50">
              {busy ? "Working..." : `Send to ${subscribed} ${subscribed === 1 ? "subscriber" : "subscribers"}`}
            </button>
            <button type="button" onClick={() => setComposing(false)} className="ml-auto text-xs text-ink-muted underline">
              Close
            </button>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <p role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
          The newsletters could not be loaded.
        </p>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas border-b border-line text-ink">
            <tr>
              <th className="p-3.5 font-semibold">Subject</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 font-semibold">Recipients</th>
              <th className="p-3.5 font-semibold">Date</th>
              <th className="p-3.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loadState === "loading" && (
              <tr>
                <td colSpan={5} className="p-6 text-ink-muted" role="status">Loading newsletters...</td>
              </tr>
            )}
            {loadState === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-muted">No newsletters yet.</td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id}>
                <td className="p-3.5 text-ink font-medium">{c.subject}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${c.status === "Sent" ? "bg-success-bg border-success-line text-success" : "bg-warning-bg border-warning-line text-warning"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-3.5 text-ink-secondary">
                  {c.status === "Sent" ? `${c.recipientCount} (${c.sentCount} delivered${c.failedCount ? `, ${c.failedCount} failed` : ""})` : "—"}
                </td>
                <td className="p-3.5 text-ink-secondary">{formatDateTime(c.sentAt || c.createdAt)}</td>
                <td className="p-3.5 text-right">
                  {c.status === "Draft" && (
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDraft({ id: c.id, subject: c.subject, preheader: c.preheader || "", body: c.body });
                          setComposing(true);
                          setError("");
                          setNotice("");
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-ink/5"
                      >
                        Edit
                      </button>
                      <button type="button" aria-label={`Delete draft ${c.subject}`} onClick={() => void remove(c)} className="p-1.5 rounded-md hover:bg-error-bg text-ink-secondary hover:text-error">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
