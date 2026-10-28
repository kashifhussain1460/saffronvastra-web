"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface Values {
  store: { name: string; supportEmail: string; supportPhone: string; address: string };
  announcement: { enabled: boolean; text: string; link: string };
  shipping: { freeShippingThreshold: string; flatFee: string };
  cod: { enabled: boolean; fee: string };
  notifications: { adminEmail: string };
}

type Errors = Record<string, string>; // "group.field" -> message

const toForm = (d: any): Values => ({
  store: { ...d.store },
  announcement: { ...d.announcement },
  shipping: { freeShippingThreshold: String(d.shipping.freeShippingThreshold), flatFee: String(d.shipping.flatFee) },
  cod: { enabled: d.cod.enabled, fee: String(d.cod.fee) },
  notifications: { ...d.notifications },
});

function num(v: string): number {
  return v.trim() === "" ? NaN : Number(v);
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Values | null>(null);
  const [meta, setMeta] = useState<Record<string, { updatedAt: string } | null>>({});
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadMessage, setLoadMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await api("/api/v1/admin/settings");
    if (!res.ok) {
      setLoadMessage(res.message);
      setLoadState("error");
      return;
    }
    setValues(toForm(res.body.data));
    setMeta(res.body.meta || {});
    setLoadState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <G extends keyof Values>(group: G, key: keyof Values[G], value: Values[G][keyof Values[G]]) =>
    setValues((v) => (v ? { ...v, [group]: { ...v[group], [key]: value } } : v));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setNotice("");
    setFormError("");
    const local: Errors = {};
    const threshold = num(values.shipping.freeShippingThreshold);
    const fee = num(values.shipping.flatFee);
    const cod = num(values.cod.fee);
    if (Number.isNaN(threshold) || threshold < 0) local["shipping.freeShippingThreshold"] = "Enter the free shipping threshold in rupees (0 or more)";
    if (Number.isNaN(fee) || fee < 0) local["shipping.flatFee"] = "Enter the shipping fee in rupees (0 or more)";
    if (Number.isNaN(cod) || cod < 0) local["cod.fee"] = "Enter the COD fee in rupees (0 or more)";
    if (values.announcement.text.length > 140) local["announcement.text"] = "Announcement text must be 140 characters or fewer";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    const res = await api("/api/v1/admin/settings", {
      method: "PUT",
      json: {
        store: values.store,
        announcement: values.announcement,
        shipping: { freeShippingThreshold: threshold, flatFee: fee },
        cod: { enabled: values.cod.enabled, fee: cod },
        notifications: values.notifications,
      },
    });
    setSaving(false);
    if (!res.ok) {
      const server: Errors = {};
      const groups = res.body?.errors as Record<string, Record<string, string[]>> | undefined;
      for (const [g, fields] of Object.entries(groups || {})) {
        for (const [f, msgs] of Object.entries(fields || {})) if (msgs?.[0]) server[`${g}.${f}`] = msgs[0];
      }
      setErrors(server);
      setFormError(res.message);
      return;
    }
    setValues(toForm(res.body.data));
    setMeta(res.body.meta || {});
    setErrors({});
    setNotice("Settings saved.");
  };

  if (loadState === "loading") {
    return <p role="status" className="text-xs text-ink-muted">Loading settings...</p>;
  }
  if (loadState === "error" || !values) {
    return (
      <div role="alert" className="p-5 bg-error-bg border border-error-line text-error rounded-xl text-xs flex items-center justify-between gap-3 max-w-3xl">
        <span>The settings could not be loaded. {loadMessage}</span>
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
    );
  }

  const field = "w-full px-3 py-2 bg-surface border border-line rounded-md text-xs focus:outline-none focus:border-primary";
  const err = (k: string) =>
    errors[k] ? (
      <p data-testid={`error-${k}`} className="text-[11px] text-error mt-1">
        {errors[k]}
      </p>
    ) : null;
  const lastSaved = Object.values(meta)
    .filter(Boolean)
    .map((m) => m!.updatedAt)
    .sort()
    .pop();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Store Settings</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {lastSaved ? `Last saved ${formatDateTime(lastSaved)}.` : "Nothing saved yet: the shop is using its default settings."}
          </p>
        </div>
        <button
          type="submit"
          form="settings-form"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save changes"}</span>
        </button>
      </div>

      {notice && (
        <div role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs">
          {notice}
        </div>
      )}
      {formError && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
          {formError}
        </div>
      )}

      <form id="settings-form" onSubmit={save} noValidate className="space-y-6">
        <section aria-labelledby="s-store" className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 id="s-store" className="font-serif text-lg">Store profile</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="store-name" className="block text-xs font-semibold mb-1">Store name</label>
              <input id="store-name" value={values.store.name} onChange={(e) => update("store", "name", e.target.value)} className={field} />
              {err("store.name")}
            </div>
            <div>
              <label htmlFor="store-email" className="block text-xs font-semibold mb-1">Support email</label>
              <input id="store-email" type="email" value={values.store.supportEmail} onChange={(e) => update("store", "supportEmail", e.target.value)} className={field} />
              {err("store.supportEmail")}
            </div>
            <div>
              <label htmlFor="store-phone" className="block text-xs font-semibold mb-1">Support phone</label>
              <input id="store-phone" value={values.store.supportPhone} onChange={(e) => update("store", "supportPhone", e.target.value)} className={field} />
              {err("store.supportPhone")}
            </div>
            <div>
              <label htmlFor="store-address" className="block text-xs font-semibold mb-1">Address</label>
              <input id="store-address" value={values.store.address} onChange={(e) => update("store", "address", e.target.value)} className={field} />
              {err("store.address")}
            </div>
          </div>
        </section>

        <section aria-labelledby="s-announce" className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 id="s-announce" className="font-serif text-lg">Announcement bar</h2>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={values.announcement.enabled} onChange={(e) => update("announcement", "enabled", e.target.checked)} />
            Show the bar at the top of the storefront
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ann-text" className="block text-xs font-semibold mb-1">
                Text ({values.announcement.text.length}/140)
              </label>
              <input id="ann-text" value={values.announcement.text} onChange={(e) => update("announcement", "text", e.target.value)} className={field} />
              {err("announcement.text")}
            </div>
            <div>
              <label htmlFor="ann-link" className="block text-xs font-semibold mb-1">Link (optional)</label>
              <input id="ann-link" value={values.announcement.link} onChange={(e) => update("announcement", "link", e.target.value)} placeholder="/collections or https://..." className={field} />
              {err("announcement.link")}
            </div>
          </div>
        </section>

        <section aria-labelledby="s-ship" className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 id="s-ship" className="font-serif text-lg">Shipping</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ship-threshold" className="block text-xs font-semibold mb-1">Free shipping from (₹)</label>
              <input id="ship-threshold" inputMode="decimal" value={values.shipping.freeShippingThreshold} onChange={(e) => update("shipping", "freeShippingThreshold", e.target.value)} className={field} />
              {err("shipping.freeShippingThreshold")}
            </div>
            <div>
              <label htmlFor="ship-fee" className="block text-xs font-semibold mb-1">Shipping fee below that (₹)</label>
              <input id="ship-fee" inputMode="decimal" value={values.shipping.flatFee} onChange={(e) => update("shipping", "flatFee", e.target.value)} className={field} />
              {err("shipping.flatFee")}
            </div>
          </div>
        </section>

        <section aria-labelledby="s-cod" className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 id="s-cod" className="font-serif text-lg">Cash on Delivery</h2>
          <p className="text-[11px] text-ink-muted">Cash on Delivery is the only payment method. Turning it off stops all new orders.</p>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={values.cod.enabled} onChange={(e) => update("cod", "enabled", e.target.checked)} />
            Accept Cash on Delivery orders
          </label>
          <div className="max-w-xs">
            <label htmlFor="cod-fee" className="block text-xs font-semibold mb-1">COD handling fee (₹, 0 for none)</label>
            <input id="cod-fee" inputMode="decimal" value={values.cod.fee} onChange={(e) => update("cod", "fee", e.target.value)} className={field} />
            {err("cod.fee")}
          </div>
        </section>

        <section aria-labelledby="s-notify" className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 id="s-notify" className="font-serif text-lg">Order notifications</h2>
          <div className="max-w-md">
            <label htmlFor="notify-email" className="block text-xs font-semibold mb-1">Admin notification email</label>
            <input id="notify-email" type="email" value={values.notifications.adminEmail} onChange={(e) => update("notifications", "adminEmail", e.target.value)} placeholder="Leave empty to use the server default" className={field} />
            <p className="text-[11px] text-ink-muted mt-1">New-order and new-message alerts go here. When empty, the server&apos;s configured address (or the admin accounts) is used.</p>
            {err("notifications.adminEmail")}
          </div>
        </section>
      </form>
    </div>
  );
}
