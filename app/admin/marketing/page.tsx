"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, formatDay } from "@/lib/adminApi";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string | null;
  minSubtotal: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  state: "Active" | "Disabled" | "Scheduled" | "Expired" | "Exhausted";
}

interface FormState {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: string;
  description: string;
  minSubtotal: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  id: "",
  code: "",
  type: "percent",
  value: "",
  description: "",
  minSubtotal: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

const STATE_STYLES: Record<Coupon["state"], string> = {
  Active: "bg-success-bg border-success-line text-success",
  Disabled: "bg-surface-muted border-line text-ink-secondary",
  Scheduled: "bg-info-bg border-info-line text-info",
  Expired: "bg-warning-bg border-warning-line text-warning",
  Exhausted: "bg-error-bg border-error-line text-error",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const discountLabel = (c: Coupon) => (c.type === "percent" ? `${c.value}% off` : `${inr(c.value)} off`);

// <input type="datetime-local"> works in local time without a zone.
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function formFromCoupon(c: Coupon): FormState {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: String(c.value),
    description: c.description || "",
    minSubtotal: c.minSubtotal ? String(c.minSubtotal) : "",
    usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
    startsAt: toLocalInput(c.startsAt),
    endsAt: toLocalInput(c.endsAt),
    active: c.active,
  };
}

// Client-side checks that mirror the server, so the person sees a message next to the field straight away.
function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  const code = f.code.trim().toUpperCase();
  if (!code) e.code = "Code is required";
  else if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = "Code must be 3-20 characters: letters, numbers, - or _";
  const value = Number(f.value);
  if (f.value.trim() === "" || Number.isNaN(value)) e.value = "Value is required";
  else if (f.type === "percent") {
    if (!Number.isInteger(value)) e.value = "Percentage must be a whole number";
    else if (value < 1 || value > 100) e.value = "Percentage must be between 1 and 100";
  } else if (value <= 0) e.value = "Amount must be greater than 0";
  if (f.minSubtotal.trim() !== "" && (Number.isNaN(Number(f.minSubtotal)) || Number(f.minSubtotal) < 0)) {
    e.minSubtotal = "Minimum order must be 0 or more";
  }
  if (f.usageLimit.trim() !== "") {
    const n = Number(f.usageLimit);
    if (!Number.isInteger(n) || n < 1) e.usageLimit = "Usage limit must be a whole number, at least 1";
  }
  if (f.startsAt && f.endsAt && new Date(f.endsAt) <= new Date(f.startsAt)) e.endsAt = "End date must be after the start date";
  return e;
}

export default function AdminMarketingPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadMessage, setLoadMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const [form, setForm] = useState<FormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (status) params.set("status", status);
    if (query) params.set("search", query);
    const res = await api(`/api/v1/admin/coupons?${params}`);
    if (!res.ok) {
      setLoadMessage(res.message);
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [page, status, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFieldErrors({});
    setFormError("");
    setNotice("");
  };

  const openEdit = (c: Coupon) => {
    setForm(formFromCoupon(c));
    setFieldErrors({});
    setFormError("");
    setNotice("");
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setFormError("");
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      description: form.description.trim() || null,
      minSubtotal: form.minSubtotal.trim() === "" ? null : Number(form.minSubtotal),
      usageLimit: form.usageLimit.trim() === "" ? null : Number(form.usageLimit),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      active: form.active,
    };
    setSaving(true);
    const res = form.id
      ? await api(`/api/v1/admin/coupons/${form.id}`, { method: "PATCH", json: payload })
      : await api("/api/v1/admin/coupons", { method: "POST", json: payload });
    setSaving(false);
    if (!res.ok) {
      const serverFields = res.body?.errors as Record<string, string[]> | undefined;
      if (serverFields) {
        setFieldErrors(Object.fromEntries(Object.entries(serverFields).filter(([, v]) => v?.[0]).map(([k, v]) => [k, v[0]])));
      }
      setFormError(res.message);
      return;
    }
    setNotice(form.id ? `Coupon ${payload.code} updated.` : `Coupon ${payload.code} created.`);
    setForm(null);
    await load();
  };

  const toggle = async (c: Coupon) => {
    setActionError("");
    setNotice("");
    const res = await api(`/api/v1/admin/coupons/${c.id}`, { method: "PATCH", json: { active: !c.active } });
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setNotice(`Coupon ${c.code} ${c.active ? "disabled" : "enabled"}.`);
    await load();
  };

  const remove = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    setActionError("");
    setNotice("");
    const res = await api(`/api/v1/admin/coupons/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setNotice(`Coupon ${c.code} deleted.`);
    await load();
  };

  const field = "w-full px-3 py-2 bg-surface border border-line rounded-md text-xs focus:outline-none focus:border-primary";
  const errText = (k: string) =>
    fieldErrors[k] ? (
      <p data-testid={`error-${k}`} className="text-[11px] text-error mt-1">
        {fieldErrors[k]}
      </p>
    ) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Marketing &amp; Promotions</h1>
          <p className="text-xs text-ink-muted mt-0.5">Create the promo codes customers enter at checkout.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold hover:bg-ink/5"
          >
            <Mail className="w-4 h-4" />
            <span>Email campaigns</span>
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New coupon</span>
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs">
          {notice}
        </div>
      )}
      {actionError && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
          {actionError}
        </div>
      )}

      {form && (
        <form onSubmit={submit} noValidate aria-label="Coupon form" className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 className="font-serif text-lg">{form.id ? `Edit ${form.code}` : "New coupon"}</h2>
          {formError && (
            <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
              {formError}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-code" className="block text-xs font-semibold mb-1">Code</label>
              <input id="c-code" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} maxLength={20} className={`${field} uppercase font-mono`} />
              {errText("code")}
            </div>
            <div>
              <label htmlFor="c-type" className="block text-xs font-semibold mb-1">Discount type</label>
              <select id="c-type" value={form.type} onChange={(e) => set("type", e.target.value as FormState["type"])} className={field}>
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off (₹)</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-value" className="block text-xs font-semibold mb-1">
                {form.type === "percent" ? "Percentage (1-100)" : "Amount (₹)"}
              </label>
              <input id="c-value" inputMode="decimal" value={form.value} onChange={(e) => set("value", e.target.value)} className={field} />
              {errText("value")}
            </div>
            <div>
              <label htmlFor="c-min" className="block text-xs font-semibold mb-1">Minimum order (₹, optional)</label>
              <input id="c-min" inputMode="decimal" value={form.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} className={field} />
              {errText("minSubtotal")}
            </div>
            <div>
              <label htmlFor="c-limit" className="block text-xs font-semibold mb-1">Total usage limit (optional)</label>
              <input id="c-limit" inputMode="numeric" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} className={field} />
              {errText("usageLimit")}
            </div>
            <div>
              <label htmlFor="c-desc" className="block text-xs font-semibold mb-1">Description (optional)</label>
              <input id="c-desc" value={form.description} maxLength={200} onChange={(e) => set("description", e.target.value)} className={field} />
              {errText("description")}
            </div>
            <div>
              <label htmlFor="c-start" className="block text-xs font-semibold mb-1">Starts (optional)</label>
              <input id="c-start" type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={field} />
              {errText("startsAt")}
            </div>
            <div>
              <label htmlFor="c-end" className="block text-xs font-semibold mb-1">Ends (optional)</label>
              <input id="c-end" type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={field} />
              {errText("endsAt")}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            Active (customers can use this code)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Saving..." : form.id ? "Save changes" : "Create coupon"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold hover:bg-ink/5">
              Cancel
            </button>
          </div>
        </form>
      )}

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
          {["Active", "Disabled", "Scheduled", "Expired", "Exhausted"].map((s) => (
            <option key={s} value={s}>{s}</option>
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
            aria-label="Search coupons"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or description..."
            className="pl-8 pr-3 py-2 bg-surface border border-line rounded-md text-xs w-64 focus:outline-none focus:border-primary"
          />
        </form>
      </div>

      {loadState === "error" ? (
        <div role="alert" className="p-5 bg-error-bg border border-error-line text-error rounded-xl text-xs flex items-center justify-between gap-3">
          <span>The coupons could not be loaded. {loadMessage}</span>
          <button
            type="button"
            onClick={() => {
              setLoadState("loading");
              void load();
            }}
            className="px-3 py-1.5 bg-surface border border-error-line rounded-md font-semibold hover:bg-error-bg"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-canvas border-b border-line text-ink">
              <tr>
                <th className="p-3.5 font-semibold">Code</th>
                <th className="p-3.5 font-semibold">Discount</th>
                <th className="p-3.5 font-semibold">Minimum order</th>
                <th className="p-3.5 font-semibold">Used</th>
                <th className="p-3.5 font-semibold">Valid</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loadState === "loading" && (
                <tr>
                  <td colSpan={7} className="p-6 text-ink-muted" role="status">Loading coupons...</td>
                </tr>
              )}
              {loadState === "ready" && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted" data-testid="coupons-empty">
                    {query || status ? "No coupons match." : "No coupons yet. Create the first one with New coupon."}
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} data-testid="coupon-row" data-code={c.code}>
                  <td className="p-3.5">
                    <span className="font-mono font-semibold">{c.code}</span>
                    {c.description && <span className="block text-[11px] text-ink-muted">{c.description}</span>}
                  </td>
                  <td className="p-3.5">{discountLabel(c)}</td>
                  <td className="p-3.5">{c.minSubtotal ? inr(c.minSubtotal) : "None"}</td>
                  <td className="p-3.5" data-testid="coupon-usage">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="p-3.5 text-ink-secondary">
                    {c.startsAt || c.endsAt
                      ? `${c.startsAt ? formatDay(c.startsAt) : "Any time"} to ${c.endsAt ? formatDay(c.endsAt) : "no end"}`
                      : "Always"}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATE_STYLES[c.state]}`}>{c.state}</span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" aria-label={`Edit ${c.code}`} onClick={() => openEdit(c)} className="p-1.5 border border-line rounded-md hover:bg-ink/5">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`${c.active ? "Disable" : "Enable"} ${c.code}`}
                        onClick={() => void toggle(c)}
                        className="px-2.5 py-1 text-[11px] font-semibold border border-line rounded-md hover:bg-ink/5"
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${c.code}`}
                        disabled={c.usageCount > 0}
                        title={c.usageCount > 0 ? "Used coupons cannot be deleted. Disable it instead." : "Delete coupon"}
                        onClick={() => void remove(c)}
                        className="p-1.5 border border-line rounded-md hover:bg-error-bg hover:text-error disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
            <span>{total} {total === 1 ? "coupon" : "coupons"}</span>
            <span className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Previous</button>
              <span>{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Next</button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
