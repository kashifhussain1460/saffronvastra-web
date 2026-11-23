"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Ban, CalendarClock, RefreshCw, RotateCcw, Send, TestTube2, Trash2, Users } from "lucide-react";
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
  pct,
  SEGMENT_LABELS,
  toLocalInput,
  type EmailCampaign,
  type Sale,
  type Segment,
} from "@/lib/adminMarketing";

interface Detail extends EmailCampaign {
  statusCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  engagement: { opened: number; clicked: number; unsubscribed: number; orders: number; revenue: number; openRate: number; clickRate: number; unsubscribeRate: number; conversionRate: number };
  recentEvents: Array<{ id: string; type: string; createdAt: string; detail: any }>;
}
interface Audience {
  matched: number;
  eligible: number;
  excluded: { staff: number; inactive: number; unverified: number; noConsent: number; suppressed: number; alreadyQueued: number };
  bySource: { FAVOURITE: number; CART: number; BOTH: number };
}
interface Recipient {
  id: string;
  email: string;
  firstName: string | null;
  source: Segment;
  status: string;
  attempts: number;
  lastError: string | null;
  skipReason: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  unsubscribedAt: string | null;
  convertedAt: string | null;
  productCount: number;
}
interface Form {
  discountCampaignId: string;
  name: string;
  subject: string;
  preheader: string;
  headline: string;
  intro: string;
  segment: Segment;
}

const EMPTY: Form = { discountCampaignId: "", name: "", subject: "", preheader: "", headline: "", intro: "", segment: "BOTH" };
const toPayload = (f: Form) => ({ ...f, preheader: f.preheader || null, headline: f.headline || null, intro: f.intro || null });

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-serif">{value}</p>
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function EmailCampaignInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [campaign, setCampaign] = useState<Detail | null>(null);
  const [form, setForm] = useState<Form>({ ...EMPTY, discountCampaignId: search.get("sale") || "" });
  const [sales, setSales] = useState<Sale[]>([]);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [rStatus, setRStatus] = useState("");
  const [rPage, setRPage] = useState(1);
  const [rPages, setRPages] = useState(1);

  const editable = isNew || campaign?.status === "Draft" || campaign?.status === "Scheduled";

  const load = useCallback(async () => {
    if (isNew) return;
    const res = await api<{ data: Detail }>(`/api/v1/admin/email-campaigns/${params.id}`);
    if (!res.ok || !res.body) return setLoadError(res.message);
    const c = res.body.data;
    setCampaign(c);
    setForm({
      discountCampaignId: c.discountCampaignId || "",
      name: c.name,
      subject: c.subject,
      preheader: c.preheader || "",
      headline: c.headline || "",
      intro: c.intro || "",
      segment: c.segment,
    });
    if (c.scheduledAt) setScheduleAt(toLocalInput(c.scheduledAt));
  }, [isNew, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void api<{ data: Sale[] }>("/api/v1/admin/discounts?limit=100").then((res) => {
      if (res.ok && res.body) setSales(res.body.data.filter((s) => s.status !== "Ended"));
    });
  }, []);

  // audience preview whenever the sale or segment changes (editable only)
  useEffect(() => {
    if (!editable || !form.discountCampaignId) {
      setAudience(null);
      return;
    }
    let stale = false;
    const t = setTimeout(async () => {
      const res = await api<{ data: Audience }>(`/api/v1/admin/email-campaigns/audience?discountCampaignId=${form.discountCampaignId}&segment=${form.segment}`);
      if (!stale) setAudience(res.ok && res.body ? res.body.data : null);
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [editable, form.discountCampaignId, form.segment]);

  const loadRecipients = useCallback(async () => {
    if (isNew || !campaign || editable) return;
    const qs = new URLSearchParams({ page: String(rPage), limit: "25" });
    if (rStatus) qs.set("status", rStatus);
    const res = await api<{ data: Recipient[]; pagination: { totalPages: number } }>(`/api/v1/admin/email-campaigns/${params.id}/recipients?${qs}`);
    if (res.ok && res.body) {
      setRecipients(res.body.data);
      setRPages(res.body.pagination.totalPages);
    }
  }, [isNew, campaign, editable, params.id, rPage, rStatus]);

  useEffect(() => {
    void loadRecipients();
  }, [loadRecipients]);

  // live progress while sending
  useEffect(() => {
    if (campaign?.status !== "Sending") return;
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [campaign?.status, load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => (errors[k]?.[0] ? <p role="alert" className="text-[11px] text-error mt-1">{errors[k][0]}</p> : null);

  const save = async (): Promise<string | null> => {
    setErrors({});
    const res = await api<{ data: EmailCampaign }>(isNew ? "/api/v1/admin/email-campaigns" : `/api/v1/admin/email-campaigns/${params.id}`, {
      method: isNew ? "POST" : "PUT",
      json: toPayload(form),
    });
    if (!res.ok) {
      setErrors((res.body as any)?.errors || {});
      setMessage({ text: res.message, isError: true });
      return null;
    }
    return res.body!.data.id;
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const id = await save();
      if (!id) return;
      if (isNew) router.replace(`/admin/marketing/email-campaigns/${id}`);
      else {
        setMessage({ text: "Saved.", isError: false });
        await load();
      }
    });
  };

  const post = (path: string, body: unknown = {}) =>
    run(async () => {
      const res = await api(`/api/v1/admin/email-campaigns/${params.id}/${path}`, { method: "POST", json: body });
      setMessage({ text: res.message, isError: !res.ok });
      if (res.ok && res.body) setErrors({});
      else setErrors(((res.body as any)?.errors as Record<string, string[]>) || {});
      await load();
    });

  const sendNow = () => {
    if (!audience || audience.eligible === 0) {
      if (!window.confirm("Nobody matches right now. Send anyway (it will complete with no emails)?")) return;
    } else if (!window.confirm(`Send this email to ${audience.eligible} customer(s) now? This cannot be undone.`)) return;
    void run(async () => {
      if (!(await save())) return;
      const res = await api(`/api/v1/admin/email-campaigns/${params.id}/send`, { method: "POST", json: {} });
      setMessage({ text: res.message, isError: !res.ok });
      await load();
    });
  };

  const schedule = () =>
    void run(async () => {
      if (!scheduleAt) return setMessage({ text: "Choose when to send it.", isError: true });
      if (!(await save())) return;
      const res = await api(`/api/v1/admin/email-campaigns/${params.id}/send`, { method: "POST", json: { scheduledAt: fromLocalInput(scheduleAt) } });
      setMessage({ text: res.message, isError: !res.ok });
      setErrors(((res.body as any)?.errors as Record<string, string[]>) || {});
      await load();
    });

  const remove = () =>
    void run(async () => {
      if (!window.confirm("Delete this draft?")) return;
      const res = await api(`/api/v1/admin/email-campaigns/${params.id}`, { method: "DELETE" });
      if (res.ok) router.replace("/admin/marketing/email-campaigns");
      else setMessage({ text: res.message, isError: true });
    });

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-error-bg border border-error-line text-error rounded-xl text-xs" role="alert">
        {loadError} <Link href="/admin/marketing/email-campaigns" className="underline font-semibold">Back to email campaigns</Link>
      </div>
    );
  }

  const c = campaign;
  const selectedSale = sales.find((s) => s.id === form.discountCampaignId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link href="/admin/marketing/email-campaigns" className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <ArrowLeft className="w-3.5 h-3.5" /> Email campaigns
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight mt-1 flex items-center gap-3">
            {isNew ? "New sale email" : c?.name || "Email"}
            {c && <span className={`${badgeClass} ${EMAIL_STATUS_STYLE[c.status] || ""}`}>{c.status}</span>}
          </h1>
          {c?.discountCampaign && (
            <p className="text-xs text-ink-muted mt-0.5">
              Sale: <Link href={`/admin/marketing/discounts/${c.discountCampaign.id}`} className="underline">{c.discountCampaign.name}</Link>
              {c.scheduledAt && c.status === "Scheduled" && <> · sends {formatDateTime(c.scheduledAt)}</>}
              {c.startedAt && <> · started {formatDateTime(c.startedAt)}</>}
              {c.completedAt && <> · finished {formatDateTime(c.completedAt)}</>}
            </p>
          )}
        </div>
        {c && !editable && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void load()} className={btnSecondary} aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
            {c.status === "Sending" && (
              <>
                <button type="button" disabled={busy} onClick={() => void post("process")} className={btnSecondary}>Process queue now</button>
                <button type="button" disabled={busy} onClick={() => window.confirm("Stop sending? Emails already sent cannot be recalled.") && void post("cancel")} className={btnDanger}>
                  <Ban className="w-4 h-4" /> Cancel
                </button>
              </>
            )}
            {(c.status === "Sending" || c.status === "Completed") && (c.statusCounts.Failed || 0) > 0 && (
              <button type="button" disabled={busy} onClick={() => void post("retry-failed")} className={btnSecondary}>
                <RotateCcw className="w-4 h-4" /> Retry failed ({c.statusCounts.Failed})
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

      {editable ? (
        <form onSubmit={onSave} noValidate aria-label="Email form" className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-surface rounded-xl border border-line p-5 space-y-4">
            <div>
              <label htmlFor="e-sale" className="block text-xs font-semibold mb-1">Sale</label>
              <select id="e-sale" value={form.discountCampaignId} onChange={(e) => set("discountCampaignId", e.target.value)} className={fieldClass}>
                <option value="">Choose a sale</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.state})</option>
                ))}
              </select>
              {err("discountCampaignId")}
              {selectedSale && selectedSale.state !== "Live" && selectedSale.state !== "Scheduled" && (
                <p className="text-[11px] text-warning mt-1">This sale is {selectedSale.state.toLowerCase()}. Switch it on before sending.</p>
              )}
            </div>
            <fieldset>
              <legend className="block text-xs font-semibold mb-1">Send to customers who</legend>
              <div className="grid sm:grid-cols-3 gap-2">
                {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
                  <label key={s} className={`flex items-center gap-2 p-2.5 border rounded-md text-xs cursor-pointer ${form.segment === s ? "border-primary" : "border-line"}`}>
                    <input type="radio" name="segment" value={s} checked={form.segment === s} onChange={() => set("segment", s)} />
                    {SEGMENT_LABELS[s]}
                  </label>
                ))}
              </div>
              {err("segment")}
            </fieldset>
            <div>
              <label htmlFor="e-name" className="block text-xs font-semibold mb-1">Internal name</label>
              <input id="e-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={fieldClass} placeholder="Festive Sale – favourites" />
              {err("name")}
            </div>
            <div>
              <label htmlFor="e-subject" className="block text-xs font-semibold mb-1">Subject line</label>
              <input id="e-subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} maxLength={150} className={fieldClass} placeholder="A piece you love is now on sale" />
              {err("subject")}
            </div>
            <div>
              <label htmlFor="e-pre" className="block text-xs font-semibold mb-1">Preview text (optional)</label>
              <input id="e-pre" value={form.preheader} onChange={(e) => set("preheader", e.target.value)} maxLength={150} className={fieldClass} />
              {err("preheader")}
            </div>
            <div>
              <label htmlFor="e-head" className="block text-xs font-semibold mb-1">Headline (optional, defaults to the sale name)</label>
              <input id="e-head" value={form.headline} onChange={(e) => set("headline", e.target.value)} maxLength={120} className={fieldClass} />
              {err("headline")}
            </div>
            <div>
              <label htmlFor="e-intro" className="block text-xs font-semibold mb-1">Message (optional, plain text; a blank line starts a new paragraph)</label>
              <textarea id="e-intro" rows={4} value={form.intro} onChange={(e) => set("intro", e.target.value)} maxLength={2000} className={fieldClass} />
              {err("intro")}
            </div>
            <p className="text-[11px] text-ink-muted">
              Each customer sees their own sale pieces (up to 6) with the regular and sale price, a button to the shop, and an unsubscribe link.
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
              {c?.status === "Draft" && (
                <button type="button" onClick={remove} className={btnDanger} aria-label="Delete draft"><Trash2 className="w-4 h-4" /></button>
              )}
              {c?.status === "Scheduled" && (
                <button type="button" disabled={busy} onClick={() => void post("cancel")} className={btnDanger}><Ban className="w-4 h-4" /> Cancel schedule</button>
              )}
              <button type="submit" disabled={busy} className={btnSecondary}>{isNew ? "Save draft" : "Save"}</button>
              {!isNew && (
                <>
                  <button type="button" disabled={busy} onClick={() => void post("test")} className={btnSecondary}>
                    <TestTube2 className="w-4 h-4" /> Send me a test
                  </button>
                  <button type="button" disabled={busy} onClick={sendNow} className={btnPrimary}>
                    <Send className="w-4 h-4" /> Send now
                  </button>
                </>
              )}
            </div>
            {!isNew && (
              <div className="flex flex-wrap items-end gap-2 justify-end">
                <div>
                  <label htmlFor="e-when" className="block text-xs font-semibold mb-1">Or schedule for</label>
                  <input id="e-when" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={fieldClass} />
                  {err("scheduledAt")}
                </div>
                <button type="button" disabled={busy} onClick={schedule} className={btnSecondary}>
                  <CalendarClock className="w-4 h-4" /> Schedule
                </button>
              </div>
            )}
          </div>

          <aside className="lg:col-span-2 space-y-4">
            <section className="bg-surface rounded-xl border border-line p-5" aria-live="polite">
              <h2 className="font-serif text-lg flex items-center gap-2"><Users className="w-4 h-4" /> Who will receive it</h2>
              {!form.discountCampaignId && <p className="text-xs text-ink-muted mt-2">Choose a sale to see the audience.</p>}
              {audience && (
                <>
                  <p className="mt-2 text-3xl font-serif">{audience.eligible}</p>
                  <p className="text-[11px] text-ink-muted">of {audience.matched} signed-in customers with these pieces in their favourites or bag</p>
                  <ul className="mt-3 text-xs space-y-1">
                    <li>Favourites only: {audience.bySource.FAVOURITE} · Bag only: {audience.bySource.CART} · Both: {audience.bySource.BOTH}</li>
                  </ul>
                  <h3 className="mt-4 text-xs font-semibold">Left out</h3>
                  <ul className="mt-1 text-xs text-ink-secondary space-y-0.5">
                    <li>No consent to offers by email: {audience.excluded.noConsent}</li>
                    <li>Unsubscribed or blocked: {audience.excluded.suppressed}</li>
                    <li>Email not verified: {audience.excluded.unverified}</li>
                    <li>Account not active: {audience.excluded.inactive}</li>
                    <li>Staff accounts: {audience.excluded.staff}</li>
                    <li>Already emailed for this sale: {audience.excluded.alreadyQueued}</li>
                  </ul>
                  <p className="mt-3 text-[11px] text-ink-muted">
                    Guests and customers who already bought the piece are never included. Consent is checked again right before each email.
                  </p>
                </>
              )}
            </section>
          </aside>
        </form>
      ) : (
        c && (
          <>
            <section aria-label="Delivery" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Stat label="Recipients" value={String(c.recipientCount)} hint={`${c.statusCounts.Pending || 0} waiting`} />
              <Stat label="Sent" value={String(c.sentCount)} hint={c.recipientCount ? `${Math.round((c.sentCount / c.recipientCount) * 100)}% done` : undefined} />
              <Stat label="Failed" value={String(c.failedCount)} />
              <Stat label="Skipped" value={String(c.skippedCount)} hint="Consent withdrawn, bought, sale over…" />
              <Stat label="Unsubscribed" value={String(c.engagement.unsubscribed)} hint={pct(c.engagement.unsubscribeRate)} />
            </section>
            <section aria-label="Results" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Opened" value={String(c.engagement.opened)} hint={`${pct(c.engagement.openRate)} (approximate)`} />
              <Stat label="Clicked" value={String(c.engagement.clicked)} hint={pct(c.engagement.clickRate)} />
              <Stat label="Orders" value={String(c.engagement.orders)} hint={`${pct(c.engagement.conversionRate)} of sent, within 7 days of a click`} />
              <Stat label="Revenue" value={inr(c.engagement.revenue)} />
            </section>

            <div className="grid lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 bg-surface rounded-xl border border-line overflow-x-auto">
                <div className="p-4 border-b border-line flex items-center justify-between gap-3">
                  <h2 className="font-serif text-lg">Recipients</h2>
                  <select aria-label="Filter recipients" value={rStatus} onChange={(e) => { setRStatus(e.target.value); setRPage(1); }} className="px-2 py-1.5 bg-surface border border-line rounded-md text-xs">
                    {["", "Pending", "Sending", "Sent", "Failed", "Skipped", "Cancelled"].map((s) => <option key={s || "all"} value={s}>{s || "All"}</option>)}
                  </select>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-canvas border-b border-line">
                    <tr>
                      <th className="p-3 font-semibold">Customer</th>
                      <th className="p-3 font-semibold">Why</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recipients.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink-muted">No recipients.</td></tr>}
                    {recipients.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3">
                          {r.firstName && <span className="block font-semibold">{r.firstName}</span>}
                          <span className="text-ink-secondary">{r.email}</span>
                        </td>
                        <td className="p-3">{r.source === "BOTH" ? "Favourites + bag" : r.source === "CART" ? "Bag" : "Favourites"} · {r.productCount} piece(s)</td>
                        <td className="p-3">
                          <span className={`${badgeClass} ${EMAIL_STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
                          {(r.skipReason || r.lastError) && <span className="block text-[11px] text-ink-muted mt-0.5">{r.skipReason || r.lastError}</span>}
                          {r.attempts > 1 && <span className="block text-[11px] text-ink-muted">{r.attempts} attempts</span>}
                        </td>
                        <td className="p-3 text-[11px] text-ink-secondary">
                          {r.sentAt && <span className="block">Sent {formatDateTime(r.sentAt)}</span>}
                          {r.openedAt && <span className="block">Opened</span>}
                          {r.clickedAt && <span className="block">Clicked</span>}
                          {r.convertedAt && <span className="block text-success font-semibold">Ordered</span>}
                          {r.unsubscribedAt && <span className="block text-error">Unsubscribed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rPages > 1 && (
                  <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
                    <span>Page {rPage} of {rPages}</span>
                    <span className="flex gap-2">
                      <button type="button" disabled={rPage <= 1} onClick={() => setRPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Previous</button>
                      <button type="button" disabled={rPage >= rPages} onClick={() => setRPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">Next</button>
                    </span>
                  </div>
                )}
              </section>
              <section className="bg-surface rounded-xl border border-line p-5 space-y-4">
                <div>
                  <h2 className="font-serif text-lg">Message</h2>
                  <dl className="mt-2 text-xs space-y-1.5">
                    <div><dt className="text-ink-muted">Subject</dt><dd className="font-semibold">{c.subject}</dd></div>
                    {c.preheader && <div><dt className="text-ink-muted">Preview text</dt><dd>{c.preheader}</dd></div>}
                    <div><dt className="text-ink-muted">Audience</dt><dd>{SEGMENT_LABELS[c.segment]}</dd></div>
                  </dl>
                </div>
                <div>
                  <h2 className="font-serif text-lg">Activity</h2>
                  <ul className="mt-2 text-xs divide-y divide-line">
                    {c.recentEvents.length === 0 && <li className="py-2 text-ink-muted">Nothing yet.</li>}
                    {c.recentEvents.map((e) => (
                      <li key={e.id} className="py-1.5 flex justify-between gap-2">
                        <span>{e.type}{e.type === "Queued" && e.detail?.recipients != null ? ` (${e.detail.recipients})` : ""}</span>
                        <span className="text-ink-muted">{formatDateTime(e.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          </>
        )
      )}
    </div>
  );
}

export default function EmailCampaignPage() {
  return (
    <Suspense fallback={null}>
      <EmailCampaignInner />
    </Suspense>
  );
}
