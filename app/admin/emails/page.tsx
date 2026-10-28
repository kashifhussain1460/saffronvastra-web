"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface EmailRow {
  id: string;
  to: string;
  template: string;
  subject: string;
  status: "Pending" | "Sent" | "Failed" | "Skipped";
  error: string | null;
  attempts: number;
  relatedId: string | null;
  sensitive: boolean;
  createdAt: string;
  sentAt: string | null;
}

interface EmailDetail extends EmailRow {
  html: string;
  text: string;
}

const STATUS_STYLE: Record<EmailRow["status"], string> = {
  Sent: "bg-success-bg border-success-line text-success",
  Failed: "bg-error-bg border-error-line text-error",
  Skipped: "bg-warning-bg border-warning-line text-warning",
  Pending: "bg-surface-muted border-line text-ink-secondary",
};

export default function AdminEmailsPage() {
  const [status, setStatus] = useState("");
  const [template, setTemplate] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EmailRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [templates, setTemplates] = useState<string[]>([]);
  const [provider, setProvider] = useState<{
    configured: boolean;
    from?: string;
    smtp?: { host: string; port: number; security: string; user?: string; passwordSet: boolean } | null;
    warnings?: string[];
    lastCheck?: { ok: boolean; at: string; error?: string } | null;
  } | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<EmailDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testTemplate, setTestTemplate] = useState("order-confirmation");

  useEffect(() => {
    void api("/api/v1/admin/emails/status").then((res) => {
      if (res.ok) {
        setProvider(res.body.data);
        setTemplates(res.body.data.templates || []);
      }
    });
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (status) params.set("status", status);
    if (template) params.set("template", template);
    if (query) params.set("search", query);
    const res = await api(`/api/v1/admin/emails?${params}`);
    if (!res.ok) {
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [page, status, template, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const open = async (id: string) => {
    setError("");
    const res = await api(`/api/v1/admin/emails/${id}`);
    if (!res.ok) setError(res.message);
    else setSelected(res.body.data);
  };

  const resend = async (row: EmailRow) => {
    setError("");
    setNotice("");
    const res = await api(`/api/v1/admin/emails/${row.id}/resend`, { method: "POST" });
    if (!res.ok) setError(res.message);
    else setNotice(`Resend finished with status ${res.body.data.status}.`);
    await load();
  };

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await api("/api/v1/admin/emails/test", { method: "POST", json: { to: testTo, template: testTemplate } });
    if (!res.ok) setError(res.message);
    else setNotice(`Test "${testTemplate}" recorded with status ${res.body.data.status}.`);
    await load();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Emails</h1>
        <p className="text-xs text-ink-muted mt-0.5">Every email the store sends, with its delivery status.</p>
      </div>

      {provider && (
        <div
          role="status"
          className={`p-3 rounded-md border text-xs space-y-1 ${
            !provider.configured
              ? "bg-warning-bg border-warning-line text-warning"
              : provider.lastCheck && !provider.lastCheck.ok
              ? "bg-error-bg border-error-line text-error"
              : "bg-success-bg border-success-line text-success"
          }`}
        >
          <p>
            {!provider.configured
              ? "No email provider is configured. Messages are recorded here as Skipped and are not delivered. Set the SMTP settings on the server to start sending."
              : provider.lastCheck && !provider.lastCheck.ok
              ? `The SMTP server refused the sign-in, so emails fail: ${provider.lastCheck.error}`
              : `Email provider ${provider.lastCheck?.ok ? "signed in" : "configured"}${provider.from ? `, sending as ${provider.from}` : ""}.`}
          </p>
          {provider.smtp && (
            <p>
              {provider.smtp.host}:{provider.smtp.port} · {provider.smtp.security === "ssl" ? "SSL/TLS" : provider.smtp.security === "starttls" ? "STARTTLS" : "no encryption"} · login {provider.smtp.user || "none"}
              {provider.smtp.passwordSet ? "" : " · no password set"}
              {provider.lastCheck ? ` · checked ${formatDateTime(provider.lastCheck.at)}` : ""}
            </p>
          )}
          {(provider.warnings || []).map((w) => (
            <p key={w} className="text-warning">
              Setting note: {w}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={sendTest} className="bg-surface p-4 rounded-xl border border-line flex flex-wrap items-end gap-3">
        <label className="text-xs">
          <span className="block font-semibold mb-1">Template</span>
          <select value={testTemplate} onChange={(e) => setTestTemplate(e.target.value)} className="px-3 py-2 border border-line rounded-md bg-surface">
            {templates.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="block font-semibold mb-1">Send a sample to</span>
          <input type="email" required value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" className="px-3 py-2 border border-line rounded-md w-64" />
        </label>
        <button type="submit" className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-hover">
          Send sample
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-surface border border-line rounded-md text-xs"
        >
          <option value="">Status: All</option>
          {["Sent", "Failed", "Skipped", "Pending"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by template"
          value={template}
          onChange={(e) => {
            setTemplate(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-surface border border-line rounded-md text-xs"
        >
          <option value="">Template: All</option>
          {templates.map((t) => (
            <option key={t}>{t}</option>
          ))}
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
            aria-label="Search emails"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient or subject..."
            className="pl-8 pr-3 py-2 bg-surface border border-line rounded-md text-xs w-64 focus:outline-none focus:border-primary"
          />
        </form>
      </div>

      {error && (
        <p role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs">
          {notice}
        </p>
      )}
      {loadState === "error" && (
        <p role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
          The email log could not be loaded.
        </p>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas border-b border-line">
            <tr>
              <th className="p-3.5 font-semibold">To</th>
              <th className="p-3.5 font-semibold">Subject</th>
              <th className="p-3.5 font-semibold">Template</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 font-semibold">Created</th>
              <th className="p-3.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loadState === "loading" && (
              <tr>
                <td colSpan={6} className="p-6 text-ink-muted" role="status">Loading emails...</td>
              </tr>
            )}
            {loadState === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">No emails match.</td>
              </tr>
            )}
            {items.map((m) => (
              <tr key={m.id}>
                <td className="p-3.5 text-ink">{m.to}</td>
                <td className="p-3.5 text-ink-secondary max-w-xs truncate">{m.subject}</td>
                <td className="p-3.5 text-ink-secondary">{m.template}</td>
                <td className="p-3.5">
                  <span title={m.error || undefined} className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_STYLE[m.status]}`}>
                    {m.status}
                  </span>
                </td>
                <td className="p-3.5 text-ink-secondary">{formatDateTime(m.createdAt)}</td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  <button type="button" onClick={() => void open(m.id)} aria-label={`Preview ${m.subject}`} className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-ink/5 mr-2">
                    Preview
                  </button>
                  {(m.status === "Failed" || m.status === "Skipped") && !m.sensitive && (
                    <button type="button" onClick={() => void resend(m)} aria-label={`Resend ${m.subject}`} className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-ink/5">
                      Resend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
          <span>{total} {total === 1 ? "email" : "emails"}</span>
          <span className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Previous</button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Next</button>
          </span>
        </div>
      </div>

      {selected && (
        <div role="dialog" aria-label="Email preview" className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-line flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink truncate">{selected.subject}</p>
                <p className="text-xs text-ink-muted">To {selected.to} · {selected.status}{selected.error ? ` · ${selected.error}` : ""}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-xs underline text-ink-muted">
                Close
              </button>
            </div>
            {/* sandbox with no flags: scripts and forms in the stored message cannot run */}
            <iframe title="Email content" sandbox="" srcDoc={selected.html} className="w-full flex-1 min-h-[420px] bg-surface" />
          </div>
        </div>
      )}

      <DevInbox />
    </div>
  );
}

interface DevMessage {
  id: string;
  to: string;
  template: string;
  subject: string;
  text: string;
  createdAt: string;
}

// Development and test servers only (the API answers 404 in production): the full text of recent emails, so links
// such as email confirmation can be followed while no email provider is connected.
function DevInbox() {
  const [items, setItems] = useState<DevMessage[] | null>(null);
  const [filter, setFilter] = useState("");
  const load = useCallback(async () => {
    const res = await api(`/api/v1/admin/emails/dev-sink${filter.trim() ? `?to=${encodeURIComponent(filter.trim())}` : ""}`);
    setItems(res.ok ? ((res.body?.items as DevMessage[]) || []).slice().reverse() : null);
  }, [filter]);
  useEffect(() => {
    void load();
  }, [load]);
  if (items === null) return null;
  const links = (text: string) => Array.from(new Set(text.match(/https?:\/\/[^\s)]+/g) || [])).filter((u) => /token=|unsubscribe/.test(u));
  return (
    <section aria-label="Development inbox" className="bg-surface rounded-xl border border-dashed border-warning-line p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-ink">Development inbox</h2>
          <p className="text-xs text-ink-muted">Only on development and test servers: the last emails with their working links, kept in memory until the API restarts.</p>
        </div>
        <span className="flex gap-2">
          <input type="search" aria-label="Filter by recipient" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Recipient email" className="px-3 py-2 border border-line rounded-md text-xs w-56" />
          <button type="button" onClick={() => void load()} className="px-3 py-2 border border-line rounded-md text-xs font-semibold">Refresh</button>
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-muted">No emails since the API started.</p>
      ) : (
        <ul className="divide-y divide-line text-xs">
          {items.slice(0, 30).map((m) => (
            <li key={m.id} className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-ink-muted w-36">{formatDateTime(m.createdAt)}</span>
              <span className="text-ink w-64 truncate">{m.to}</span>
              <span className="text-ink-secondary w-40">{m.template}</span>
              {links(m.text).map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="text-primary underline">
                  {/verify-email/.test(u) ? "Open confirmation link" : /reset-password/.test(u) ? "Open reset link" : "Open unsubscribe link"}
                </a>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
