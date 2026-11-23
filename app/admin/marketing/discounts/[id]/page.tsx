"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Pause, Play, Search, Square, Trash2 } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";
import {
  badgeClass,
  btnDanger,
  btnPrimary,
  btnSecondary,
  EMAIL_STATUS_STYLE,
  fieldClass,
  fromLocalInput,
  inr,
  SALE_STATE_STYLE,
  toLocalInput,
  type Sale,
} from "@/lib/adminMarketing";

interface PickerProduct {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  image: string | null;
  category: string | null;
  sales: Array<{ id: string; name: string }>;
}
interface SaleDetail extends Sale {
  products: Array<{ id: string; title: string; slug: string; status: string; image: string | null; price: number; salePrice: number }>;
  emailCampaigns: Array<{ id: string; name: string; status: string; sentCount: number; recipientCount: number }>;
  performance: { orders: number; units: number; revenue: number; savings: number };
}
interface Preview {
  products: Array<{ id: string; title: string; status: string; price: number; salePrice: number; saving: number }>;
  overlaps: Array<{ product: string; campaign: string }>;
}

interface Form {
  name: string;
  description: string;
  badgeText: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  allowCouponStacking: boolean;
  productIds: string[];
}

const inDays = (d: number) => toLocalInput(new Date(Date.now() + d * 86_400_000).toISOString());
const EMPTY: Form = {
  name: "",
  description: "",
  badgeText: "",
  discountType: "PERCENTAGE",
  value: "",
  maxDiscount: "",
  startsAt: inDays(0),
  endsAt: inDays(7),
  allowCouponStacking: false,
  productIds: [],
};

function payload(form: Form) {
  return {
    name: form.name,
    description: form.description || null,
    badgeText: form.badgeText || null,
    discountType: form.discountType,
    value: form.value === "" ? undefined : Number(form.value),
    maxDiscount: form.discountType === "PERCENTAGE" && form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    allowCouponStacking: form.allowCouponStacking,
    productIds: form.productIds,
  };
}

export default function DiscountEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const [pickerQuery, setPickerQuery] = useState("");
  const [picker, setPicker] = useState<PickerProduct[]>([]);
  const [known, setKnown] = useState<Record<string, { title: string; price: number }>>({});
  const [preview, setPreview] = useState<Preview | null>(null);

  const readOnly = sale?.status === "Ended";

  const load = useCallback(async () => {
    if (isNew) return;
    const res = await api<{ data: SaleDetail }>(`/api/v1/admin/discounts/${params.id}`);
    if (!res.ok || !res.body) return setLoadError(res.message);
    const s = res.body.data;
    setSale(s);
    setForm({
      name: s.name,
      description: s.description || "",
      badgeText: s.badgeText || "",
      discountType: s.discountType,
      value: String(s.value),
      maxDiscount: s.maxDiscount != null ? String(s.maxDiscount) : "",
      startsAt: toLocalInput(s.startsAt),
      endsAt: toLocalInput(s.endsAt),
      allowCouponStacking: s.allowCouponStacking,
      productIds: s.products.map((p) => p.id),
    });
    setKnown((k) => ({ ...k, ...Object.fromEntries(s.products.map((p) => [p.id, { title: p.title, price: p.price }])) }));
  }, [isNew, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // product picker
  // (`stale`: a slower earlier answer must never replace the answer to what the admin typed last)
  useEffect(() => {
    let stale = false;
    const t = setTimeout(async () => {
      const res = await api<{ data: PickerProduct[] }>(`/api/v1/admin/discounts/products?q=${encodeURIComponent(pickerQuery)}`);
      if (stale) return;
      if (res.ok && res.body) {
        setPicker(res.body.data);
        setKnown((k) => ({ ...k, ...Object.fromEntries(res.body!.data.map((p) => [p.id, { title: p.title, price: p.price }])) }));
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [pickerQuery]);

  // live price preview (server-side engine, same rounding as checkout)
  const previewKey = JSON.stringify([form.discountType, form.value, form.maxDiscount, form.startsAt, form.endsAt, form.productIds]);
  useEffect(() => {
    if (!form.productIds.length || form.value === "" || !form.startsAt || !form.endsAt) {
      setPreview(null);
      return;
    }
    let stale = false;
    const t = setTimeout(async () => {
      const res = await api<{ data: Preview }>("/api/v1/admin/discounts/preview", {
        method: "POST",
        json: { ...payload(form), name: form.name.length >= 3 ? form.name : "Preview", campaignId: isNew ? null : params.id },
      });
      if (!stale) setPreview(res.ok && res.body ? res.body.data : null);
    }, 400);
    return () => {
      stale = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleProduct = (id: string) =>
    setForm((f) => ({ ...f, productIds: f.productIds.includes(id) ? f.productIds.filter((p) => p !== id) : [...f.productIds, id] }));
  const err = (k: string) => (errors[k]?.[0] ? <p role="alert" className="text-[11px] text-error mt-1">{errors[k][0]}</p> : null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || readOnly) return;
    setBusy(true);
    setErrors({});
    setMessage(null);
    const res = await api<{ data: Sale; message: string }>(isNew ? "/api/v1/admin/discounts" : `/api/v1/admin/discounts/${params.id}`, {
      method: isNew ? "POST" : "PUT",
      json: isNew ? payload(form) : { ...payload(form), version: sale?.version },
    });
    setBusy(false);
    if (!res.ok) {
      setErrors((res.body as any)?.errors || {});
      return setMessage({ text: res.message, isError: true });
    }
    if (isNew) return router.replace(`/admin/marketing/discounts/${res.body!.data.id}`);
    setMessage({ text: res.message || "Saved.", isError: false });
    await load();
  };

  const action = async (name: "activate" | "pause" | "end") => {
    if (!sale || busy) return;
    if (name === "end" && !window.confirm("End this sale now? Prices go back to normal straight away and it cannot be restarted.")) return;
    setBusy(true);
    setMessage(null);
    const res = await api(`/api/v1/admin/discounts/${sale.id}/${name}`, { method: "POST", json: { version: sale.version } });
    setBusy(false);
    setMessage({ text: res.message, isError: !res.ok });
    await load();
  };

  const remove = async () => {
    if (!sale || !window.confirm("Delete this draft sale?")) return;
    const res = await api(`/api/v1/admin/discounts/${sale.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/marketing/discounts");
    else setMessage({ text: res.message, isError: true });
  };

  const selected = useMemo(() => form.productIds.map((id) => ({ id, ...(known[id] || { title: "Loading...", price: 0 }) })), [form.productIds, known]);

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-error-bg border border-error-line text-error rounded-xl text-xs" role="alert">
        {loadError} <Link href="/admin/marketing/discounts" className="underline font-semibold">Back to discounts</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link href="/admin/marketing/discounts" className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <ArrowLeft className="w-3.5 h-3.5" /> Discounts
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight mt-1 flex items-center gap-3">
            {isNew ? "New sale" : sale?.name || "Sale"}
            {sale && <span className={`${badgeClass} ${SALE_STATE_STYLE[sale.state]}`}>{sale.state}</span>}
          </h1>
          {sale && (
            <p className="text-xs text-ink-muted mt-0.5">
              Version {sale.version} · updated {formatDateTime(sale.updatedAt)}
            </p>
          )}
        </div>
        {sale && (
          <div className="flex flex-wrap gap-2">
            {(sale.status === "Draft" || sale.status === "Paused") && (
              <button type="button" disabled={busy} onClick={() => void action("activate")} className={btnPrimary}>
                <Play className="w-4 h-4" /> {sale.status === "Paused" ? "Resume" : "Switch on"}
              </button>
            )}
            {sale.status === "Active" && (
              <button type="button" disabled={busy} onClick={() => void action("pause")} className={btnSecondary}>
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            {(sale.status === "Active" || sale.status === "Paused") && (
              <button type="button" disabled={busy} onClick={() => void action("end")} className={btnDanger}>
                <Square className="w-4 h-4" /> End sale
              </button>
            )}
            {sale.status !== "Ended" && (
              <Link href={`/admin/marketing/email-campaigns/new?sale=${sale.id}`} className={btnSecondary}>
                <Mail className="w-4 h-4" /> Email customers
              </Link>
            )}
            {sale.status === "Draft" && (
              <button type="button" onClick={() => void remove()} className={btnDanger} aria-label="Delete draft">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {message && (
        <div role={message.isError ? "alert" : "status"} className={`p-3 rounded-md text-xs border ${message.isError ? "bg-error-bg border-error-line text-error" : "bg-success-bg border-success-line text-success"}`}>
          {message.text}
        </div>
      )}

      {sale && sale.status !== "Draft" && (
        <section aria-label="Performance" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Orders", String(sale.performance.orders)],
            ["Pieces sold", String(sale.performance.units)],
            ["Revenue", inr(sale.performance.revenue)],
            ["Savings given", inr(sale.performance.savings)],
          ].map(([label, value]) => (
            <div key={label} className="bg-surface border border-line rounded-xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
              <p className="mt-1 text-xl font-serif">{value}</p>
            </div>
          ))}
        </section>
      )}

      <form onSubmit={save} noValidate aria-label="Sale form" className="grid lg:grid-cols-5 gap-6">
        <fieldset disabled={readOnly} className="lg:col-span-3 bg-surface rounded-xl border border-line p-5 space-y-4">
          <legend className="sr-only">Sale details</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="s-name" className="block text-xs font-semibold mb-1">Name</label>
              <input id="s-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={fieldClass} placeholder="Festive Sale" />
              {err("name")}
            </div>
            <div>
              <label htmlFor="s-type" className="block text-xs font-semibold mb-1">Discount</label>
              <select id="s-type" value={form.discountType} onChange={(e) => set("discountType", e.target.value as Form["discountType"])} className={fieldClass}>
                <option value="PERCENTAGE">Percentage off</option>
                <option value="FIXED_AMOUNT">Fixed amount off each piece (₹)</option>
              </select>
              {err("discountType")}
            </div>
            <div>
              <label htmlFor="s-value" className="block text-xs font-semibold mb-1">{form.discountType === "PERCENTAGE" ? "Percentage (1-90)" : "Amount off (₹, whole rupees)"}</label>
              <input id="s-value" inputMode="numeric" value={form.value} onChange={(e) => set("value", e.target.value.replace(/[^\d]/g, ""))} className={fieldClass} />
              {err("value")}
            </div>
            {form.discountType === "PERCENTAGE" && (
              <div>
                <label htmlFor="s-max" className="block text-xs font-semibold mb-1">Maximum saving per piece (₹, optional)</label>
                <input id="s-max" inputMode="numeric" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value.replace(/[^\d]/g, ""))} className={fieldClass} />
                {err("maxDiscount")}
              </div>
            )}
            <div>
              <label htmlFor="s-badge" className="block text-xs font-semibold mb-1">Badge on product cards (optional)</label>
              <input id="s-badge" value={form.badgeText} onChange={(e) => set("badgeText", e.target.value)} maxLength={24} className={fieldClass} placeholder="Festive Sale" />
              {err("badgeText")}
            </div>
            <div>
              <label htmlFor="s-start" className="block text-xs font-semibold mb-1">Starts</label>
              <input id="s-start" type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={fieldClass} />
              {err("startsAt")}
            </div>
            <div>
              <label htmlFor="s-end" className="block text-xs font-semibold mb-1">Ends</label>
              <input id="s-end" type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={fieldClass} />
              {err("endsAt")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-desc" className="block text-xs font-semibold mb-1">Internal note (optional)</label>
              <textarea id="s-desc" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={500} className={fieldClass} />
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={form.allowCouponStacking} onChange={(e) => set("allowCouponStacking", e.target.checked)} className="mt-0.5" />
            <span>Allow promo codes on top of the sale price (off: a code only applies to other pieces in the bag)</span>
          </label>

          <div>
            <h2 className="text-xs font-semibold mb-2">Pieces in this sale ({form.productIds.length})</h2>
            {err("productIds")}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <label htmlFor="s-pick" className="sr-only">Find pieces</label>
              <input id="s-pick" value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="Find pieces by name" className={`${fieldClass} pl-9`} />
            </div>
            <ul className="max-h-80 overflow-y-auto border border-line rounded-md divide-y divide-line" aria-label="Pieces">
              {picker.map((p) => {
                const checked = form.productIds.includes(p.id);
                const otherSales = p.sales.filter((s) => s.id !== sale?.id);
                return (
                  <li key={p.id}>
                    <label className="flex items-center gap-3 p-2 text-xs cursor-pointer hover:bg-canvas">
                      <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} />
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="w-9 h-9 object-cover rounded" loading="lazy" />
                      ) : (
                        <span className="w-9 h-9 rounded bg-surface-muted" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-semibold">{p.title}</span>
                        <span className="text-ink-muted">
                          {inr(p.price)}
                          {p.status !== "Active" && ` · ${p.status}`}
                          {otherSales.length > 0 && <span className="text-warning"> · in {otherSales.map((s) => s.name).join(", ")}</span>}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
              {picker.length === 0 && <li className="p-3 text-xs text-ink-muted">No pieces found.</li>}
            </ul>
          </div>

          {!readOnly && (
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/admin/marketing/discounts" className={btnSecondary}>Cancel</Link>
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving..." : isNew ? "Save as draft" : "Save changes"}</button>
            </div>
          )}
          {readOnly && <p className="text-xs text-ink-muted">This sale has ended and is kept for reporting. Create a new sale to run it again.</p>}
        </fieldset>

        <aside className="lg:col-span-2 space-y-4">
          <section className="bg-surface rounded-xl border border-line p-5">
            <h2 className="font-serif text-lg">Price preview</h2>
            <p className="text-[11px] text-ink-muted">Calculated by the server exactly as checkout will charge (savings round down to whole rupees).</p>
            {preview?.overlaps.length ? (
              <div role="alert" className="mt-3 p-3 bg-warning-bg border border-warning-line text-warning rounded-md text-[11px]">
                Already in another sale for these dates: {preview.overlaps.map((o) => `${o.product} (${o.campaign})`).join(", ")}. It cannot be switched on until that is resolved.
              </div>
            ) : null}
            <ul className="mt-3 divide-y divide-line text-xs">
              {(preview?.products ?? selected.map((p) => ({ id: p.id, title: p.title, status: "", price: p.price, salePrice: p.price, saving: 0 }))).map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{p.title}</span>
                  <span className="shrink-0 text-right">
                    <span className="font-semibold text-secondary">{inr(p.salePrice)}</span>{" "}
                    {p.saving > 0 && <span className="text-ink-muted line-through">{inr(p.price)}</span>}
                  </span>
                </li>
              ))}
              {form.productIds.length === 0 && <li className="py-2 text-ink-muted">Choose pieces to see their sale prices.</li>}
            </ul>
          </section>

          {sale && sale.emailCampaigns.length > 0 && (
            <section className="bg-surface rounded-xl border border-line p-5">
              <h2 className="font-serif text-lg">Emails for this sale</h2>
              <ul className="mt-2 divide-y divide-line text-xs">
                {sale.emailCampaigns.map((e) => (
                  <li key={e.id} className="py-2 flex items-center justify-between gap-2">
                    <Link href={`/admin/marketing/email-campaigns/${e.id}`} className="font-semibold hover:underline">{e.name}</Link>
                    <span className={`${badgeClass} ${EMAIL_STATUS_STYLE[e.status] || ""}`}>{e.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </form>
    </div>
  );
}
