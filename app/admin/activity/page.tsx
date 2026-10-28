"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download, Search, ShieldAlert } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface AuditRow {
  id: string;
  action: string;
  category: "admin" | "security";
  status: "success" | "failure" | "denied";
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  entityType: string;
  entityId: string;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  safeDiff: any;
  createdAt: string;
}

const STATUS_STYLE: Record<AuditRow["status"], string> = {
  success: "bg-success-bg border-success-line text-success",
  failure: "bg-warning-bg border-warning-line text-warning",
  denied: "bg-error-bg border-error-line text-error",
};

const humanAction = (a: string) => a.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function AdminActivityPage() {
  const [filters, setFilters] = useState({ search: "", category: "", status: "", entityType: "", from: "", to: "" });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AuditRow[]>([]);
  const [entityTypes, setEntityTypes] = useState<Array<{ entityType: string; count: number }>>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const query = useCallback(
    (extra: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      Object.entries({ ...applied, ...extra }).forEach(([k, v]) => v && params.set(k, v));
      return params;
    },
    [applied]
  );

  const load = useCallback(async () => {
    setLoadState("loading");
    const res = await api(`/api/v1/admin/audit-logs?${query({ page: String(page), limit: "25" })}`);
    if (!res.ok) {
      setError(res.message);
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setEntityTypes(res.body.entityTypes || []);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [query, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  const changeRows = (diff: any): Array<[string, unknown, unknown]> =>
    diff?.changes && typeof diff.changes === "object" ? Object.entries(diff.changes).map(([field, v]: [string, any]) => [field, v?.before, v?.after]) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Activity Log</h1>
          <p className="text-xs text-ink-muted mt-0.5">Who changed what and when, plus sign-in and access events. Entries cannot be edited or deleted.</p>
        </div>
        <a
          href={`/api/v1/admin/audit-logs/export.csv?${query()}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold hover:bg-ink/5"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </a>
      </div>

      <form onSubmit={apply} className="bg-surface p-4 rounded-xl border border-line grid grid-cols-2 md:grid-cols-7 gap-3 items-end text-xs" aria-label="Filter activity">
        <label className="col-span-2">
          <span className="block font-semibold mb-1">Search</span>
          <span className="relative block">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Action, actor email, record or request id"
              className="w-full pl-8 pr-3 py-2 border border-line rounded-md"
            />
          </span>
        </label>
        <label>
          <span className="block font-semibold mb-1">Type</span>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="w-full px-2 py-2 border border-line rounded-md bg-surface">
            <option value="">All</option>
            <option value="admin">Staff changes</option>
            <option value="security">Security</option>
          </select>
        </label>
        <label>
          <span className="block font-semibold mb-1">Result</span>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-2 py-2 border border-line rounded-md bg-surface">
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="denied">Denied</option>
          </select>
        </label>
        <label>
          <span className="block font-semibold mb-1">Record type</span>
          <select value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} className="w-full px-2 py-2 border border-line rounded-md bg-surface">
            <option value="">All</option>
            {entityTypes.map((t) => (
              <option key={t.entityType} value={t.entityType}>
                {t.entityType} ({t.count})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block font-semibold mb-1">From</span>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="w-full px-2 py-2 border border-line rounded-md" />
        </label>
        <label>
          <span className="block font-semibold mb-1">To</span>
          <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="w-full px-2 py-2 border border-line rounded-md" />
        </label>
        <div className="col-span-2 md:col-span-7 flex gap-2">
          <button type="submit" className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-md hover:bg-primary-hover">
            Apply filters
          </button>
          <button
            type="button"
            onClick={() => {
              const empty = { search: "", category: "", status: "", entityType: "", from: "", to: "" };
              setFilters(empty);
              setApplied(empty);
              setPage(1);
            }}
            className="px-4 py-2 border border-line rounded-md hover:bg-ink/5"
          >
            Reset
          </button>
        </div>
      </form>

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>{error || "The activity log could not be loaded."}</span>
          <button type="button" className="underline font-semibold" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas border-b border-line">
            <tr>
              <th className="p-3.5 font-semibold">When</th>
              <th className="p-3.5 font-semibold">Action</th>
              <th className="p-3.5 font-semibold">Result</th>
              <th className="p-3.5 font-semibold">Who</th>
              <th className="p-3.5 font-semibold">Record</th>
              <th className="p-3.5 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loadState === "loading" && (
              <tr>
                <td colSpan={6} className="p-6 text-ink-muted" role="status">Loading activity...</td>
              </tr>
            )}
            {loadState === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">No activity matches these filters.</td>
              </tr>
            )}
            {loadState !== "loading" &&
              items.map((r) => (
                <tr key={r.id}>
                  <td className="p-3.5 whitespace-nowrap text-ink-secondary" title={r.createdAt}>{formatDateTime(r.createdAt)}</td>
                  <td className="p-3.5 text-ink">
                    {r.category === "security" && <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-secondary" aria-label="Security event" />}
                    {humanAction(r.action)}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="p-3.5 text-ink-secondary">{r.actorEmail || (r.actorUserId ? r.actorUserId.slice(0, 8) : "Visitor")}{r.actorRole ? ` (${r.actorRole})` : ""}</td>
                  <td className="p-3.5 text-ink-secondary max-w-[220px] truncate" title={`${r.entityType} ${r.entityId}`}>
                    {r.entityType} {r.entityId !== "-" ? <span className="text-ink-muted">{r.entityId.slice(0, 40)}</span> : null}
                  </td>
                  <td className="p-3.5 text-right">
                    <button type="button" onClick={() => setSelected(r)} aria-label={`Details of ${humanAction(r.action)}`} className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-ink/5">
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
          <span>{total} {total === 1 ? "entry" : "entries"}</span>
          <span className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Previous</button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Next page</button>
          </span>
        </div>
      </div>

      {selected && (
        <div role="dialog" aria-label="Activity details" className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 text-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-ink">{humanAction(selected.action)}</h2>
                <p className="text-ink-muted mt-1">{new Date(selected.createdAt).toLocaleString("en-GB", { timeZoneName: "short" })}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="underline text-ink-muted">Close</button>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Result", selected.status],
                ["Type", selected.category === "security" ? "Security" : "Staff change"],
                ["Who", `${selected.actorEmail || selected.actorUserId || "Visitor"}${selected.actorRole ? ` (${selected.actorRole})` : ""}`],
                ["Record", `${selected.entityType} ${selected.entityId}`],
                ["Request id", selected.requestId || "-"],
                ["IP address", selected.ipAddress || "-"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-ink mt-0.5 break-all">{v}</dd>
                </div>
              ))}
            </dl>
            {changeRows(selected.safeDiff).length > 0 && (
              <table className="w-full border border-line" aria-label="Changes">
                <thead className="bg-canvas">
                  <tr>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Before</th>
                    <th className="p-2 text-left">After</th>
                  </tr>
                </thead>
                <tbody>
                  {changeRows(selected.safeDiff).map(([field, before, after]) => (
                    <tr key={field} className="border-t border-line">
                      <td className="p-2 font-semibold">{field}</td>
                      <td className="p-2 text-error break-all">{JSON.stringify(before)}</td>
                      <td className="p-2 text-success break-all">{JSON.stringify(after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {selected.safeDiff && (
              <details>
                <summary className="cursor-pointer font-semibold">Recorded details</summary>
                <pre className="mt-2 p-3 bg-canvas border border-line rounded overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(selected.safeDiff, null, 2)}</pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
