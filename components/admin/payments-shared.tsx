"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/* Shared pieces for the admin payments / refunds / returns screens. Colours come from the semantic tokens only. */

export const money = (minor: number | null | undefined) =>
  `₹${((minor || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const rupeesFromMinor = (minor: number) => (minor / 100).toFixed(2);

export const when = (value: string | Date | null | undefined, withTime = true) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "";

export const providerLabel = (provider: string | null | undefined) => {
  const p = String(provider || "").toUpperCase();
  if (p === "CASHFREE") return "Online payment";
  if (p === "COD") return "Cash on Delivery";
  return provider || "Not recorded";
};

export const isOnlineProvider = (provider: string | null | undefined) => String(provider || "").toUpperCase() === "CASHFREE";

export const REASON_LABELS: Record<string, string> = {
  CHANGE_OF_MIND: "Change of mind",
  SIZE_ISSUE: "Size issue",
  DEFECTIVE: "Defective product",
  DAMAGED: "Damaged in transit",
  INCORRECT: "Incorrect product",
  NOT_AS_DESCRIBED: "Not as described",
  OTHER: "Other",
};
export const reasonLabel = (code: string) => REASON_LABELS[code] || code;

export const TYPE_LABELS: Record<string, string> = { CANCELLATION: "Cancellation", RETURN: "Return", EXCHANGE: "Exchange" };
export const typeLabel = (type: string) => TYPE_LABELS[type] || type;

/** Pill classes for a payment status (text is always shown next to the colour). */
export const paymentBadgeClass = (status: string) => {
  switch (status) {
    case "Paid":
    case "SUCCESS":
    case "COMPLETED":
      return "bg-success-bg text-success border-success-line";
    case "Failed":
    case "FAILED":
    case "EXPIRED":
      return "bg-error-bg text-error border-error-line";
    case "Partially Refunded":
      return "bg-warning-bg text-warning border-warning-line";
    case "Refunded":
      return "bg-info-bg text-info border-info-line";
    default:
      return "bg-surface-muted text-ink-secondary border-line";
  }
};

export const requestBadgeClass = (status: string) => {
  switch (status) {
    case "Requested":
      return "bg-warning-bg text-warning border-warning-line";
    case "Approved":
    case "Received":
      return "bg-info-bg text-info border-info-line";
    case "Completed":
      return "bg-success-bg text-success border-success-line";
    case "Rejected":
      return "bg-error-bg text-error border-error-line";
    default:
      return "bg-surface-muted text-ink-secondary border-line";
  }
};

export function Pill({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...rest}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${className || ""}`}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{children}</span>
    </span>
  );
}

/** The API's message for a failed call, or a plain fallback. */
export async function readError(res: Response, fallback: string): Promise<{ message: string; code?: string }> {
  const body = await res.json().catch(() => null);
  return { message: body?.message || body?.errors?.[0]?.message || fallback, code: body?.code };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** First control to focus in a dialog: the marked one, else the first field or button that is not the close icon. */
function initialFocus(panel: HTMLElement | null): HTMLElement | null {
  if (!panel) return null;
  const marked = panel.querySelector<HTMLElement>("[data-autofocus]");
  if (marked) return marked;
  const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
  return items.find((el) => el.getAttribute("aria-label") !== "Close") || items[0] || panel;
}

/**
 * Accessible modal: role="dialog" aria-modal, labelled by its title, Escape closes, Tab stays inside,
 * focus moves in on open and back to the trigger on close, page scroll is locked while open.
 */
export function AdminDialog({
  title,
  onClose,
  children,
  maxWidth = "max-w-md",
  dismissible = true,
  testId,
  focusKey,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  dismissible?: boolean;
  testId?: string;
  /** when this changes (e.g. a new step of the dialog), focus moves to the first control again */
  focusKey?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2, 8)}`).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    initialFocus(panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dismissibleRef.current) {
          e.stopPropagation();
          closeRef.current();
        }
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === firstEl || !panel.contains(active))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !panel.contains(active))) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [mounted]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    initialFocus(panelRef.current)?.focus();
  }, [focusKey]);

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-ink/50" aria-hidden="true" onClick={() => dismissible && closeRef.current()} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        className={`relative bg-surface text-ink rounded-xl border border-line shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 space-y-4 z-10 focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <h2 id={titleId} className="font-serif text-lg text-ink">
            {title}
          </h2>
          <button type="button" onClick={() => closeRef.current()} aria-label="Close" className="p-1 rounded-md text-ink-muted hover:text-ink">
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export interface RefundablePayment {
  id: string;
  provider: string;
  amountMinor: number;
  refundableMinor: number;
  providerOrderId?: string | null;
}

type RefundResult = { status: string; amountMinor: number; method: string };

/**
 * Issue a refund for an order. Online money is sent to the payment provider (it can stay pending until the provider
 * confirms); Cash on Delivery money is transferred by staff first and the transfer reference is recorded here.
 */
export function RefundDialog({
  orderId,
  orderNumber,
  payments,
  defaultPaymentId,
  suggestedMinor,
  requestId,
  defaultReason,
  onClose,
  onChanged,
}: {
  orderId: string;
  orderNumber: string;
  payments: RefundablePayment[];
  defaultPaymentId?: string;
  suggestedMinor?: number;
  requestId?: string;
  defaultReason?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const usable = payments.filter((p) => p.refundableMinor > 0);
  const initial = usable.find((p) => p.id === defaultPaymentId) || usable[0];
  const [paymentId, setPaymentId] = useState(initial?.id || "");
  const payment = usable.find((p) => p.id === paymentId) || initial;
  const startAmount = (p?: RefundablePayment) => {
    if (!p) return "";
    if (suggestedMinor === undefined) return rupeesFromMinor(p.refundableMinor);
    return suggestedMinor > 0 ? rupeesFromMinor(Math.min(suggestedMinor, p.refundableMinor)) : "";
  };
  const [amount, setAmount] = useState(startAmount(initial));
  const [reason, setReason] = useState(defaultReason || "");
  const [reference, setReference] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<RefundResult | null>(null);
  const sending = useRef(false);

  const isCod = String(payment?.provider || "").toUpperCase() === "COD";

  const parsedMinor = (() => {
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) return null;
    return Math.round(parseFloat(amount) * 100);
  })();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!payment) errs.payment = "There is no payment left to refund.";
    if (parsedMinor === null || parsedMinor <= 0) errs.amount = "Enter an amount in rupees, with at most 2 decimals.";
    else if (payment && parsedMinor > payment.refundableMinor) errs.amount = `At most ${money(payment.refundableMinor)} can still be refunded on this payment.`;
    if (reason.trim().length < 3) errs.reason = "Give a reason (at least 3 characters).";
    if (isCod && reference.trim().length < 3) errs.reference = "Enter the bank or UPI reference of the transfer you made.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (sending.current || !payment || parsedMinor === null) return;
    sending.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/refunds`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number((parsedMinor / 100).toFixed(2)),
          reason: reason.trim(),
          paymentId: payment.id,
          ...(requestId ? { requestId } : {}),
          ...(isCod ? { manualReference: reference.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const err = await readError(res, "The refund could not be recorded.");
        setError(err.message);
        if (err.code === "REFUND_PENDING_CHECK") setLocked(true);
        setStep("form");
        onChanged();
        return;
      }
      const body = await res.json().catch(() => null);
      setResult({ status: body?.data?.status || "COMPLETED", amountMinor: body?.data?.amountMinor ?? parsedMinor, method: body?.data?.method || (isCod ? "MANUAL" : "GATEWAY") });
      setStep("done");
      onChanged();
    } catch {
      setError("Network error: please check the payment panel before trying again, the refund may or may not have been recorded.");
      setStep("form");
      onChanged();
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  const inputCls = "w-full p-2 border border-line rounded-md bg-canvas text-xs text-ink";

  if (!payment && step !== "done") {
    return (
      <AdminDialog title={`Refund order #${orderNumber}`} onClose={onClose}>
        <p className="text-xs text-ink-secondary">There is no successful payment with money left to refund on this order.</p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold">
            Close
          </button>
        </div>
      </AdminDialog>
    );
  }

  return (
    <AdminDialog title={step === "done" ? "Refund recorded" : step === "confirm" ? "Confirm refund" : `Refund order #${orderNumber}`} onClose={onClose} dismissible={!submitting} testId="refund-dialog" focusKey={step}>
      {step === "done" && result ? (
        <div className="space-y-4">
          <div role="status" className={`p-3 rounded-md border text-xs ${result.status === "PENDING" ? "bg-warning-bg text-warning border-warning-line" : "bg-success-bg text-success border-success-line"}`}>
            {result.status === "PENDING"
              ? `${money(result.amountMinor)} was sent to the payment provider. The refund stays Pending until the provider confirms it; it counts against the refundable amount meanwhile.`
              : result.method === "MANUAL"
              ? `${money(result.amountMinor)} was recorded as refunded (bank / UPI reference ${reference.trim()}).`
              : `${money(result.amountMinor)} was refunded through the payment provider.`}
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} data-autofocus className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover">
              Close
            </button>
          </div>
        </div>
      ) : step === "confirm" && payment && parsedMinor !== null ? (
        <div className="space-y-4 text-xs">
          <p className="text-ink">
            You are about to refund <strong>{money(parsedMinor)}</strong> on {providerLabel(payment.provider)}.
            {isCod ? ` The transfer reference you entered is "${reference.trim()}".` : " The money is sent to the payment provider."} A refund cannot be undone.
          </p>
          <p className="text-ink-secondary">Reason: {reason.trim()}</p>
          {error && (
            <p role="alert" className="text-error">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" disabled={submitting} onClick={() => setStep("form")} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold disabled:opacity-50">
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              data-autofocus
              className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? "Refunding..." : "Confirm refund"}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3 text-xs"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (locked) return;
            setError("");
            if (validate()) setStep("confirm");
          }}
        >
          {usable.length > 1 && (
            <div>
              <label htmlFor="refund-payment" className="font-semibold block mb-1">
                Payment to refund
              </label>
              <select
                id="refund-payment"
                value={paymentId}
                onChange={(e) => {
                  setPaymentId(e.target.value);
                  setAmount(startAmount(usable.find((p) => p.id === e.target.value)));
                }}
                className={inputCls}
              >
                {usable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {providerLabel(p.provider)} {money(p.amountMinor)} (refundable {money(p.refundableMinor)})
                  </option>
                ))}
              </select>
            </div>
          )}
          {payment && (
            <p className="text-ink-secondary">
              {providerLabel(payment.provider)}: {money(payment.refundableMinor)} can still be refunded.
            </p>
          )}
          <div>
            <label htmlFor="refund-amount" className="font-semibold block mb-1">
              Refund amount (₹)
            </label>
            <input
              id="refund-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(fieldErrors.amount)}
              aria-describedby={fieldErrors.amount ? "refund-amount-error" : undefined}
              className={inputCls}
            />
            {fieldErrors.amount && (
              <p id="refund-amount-error" role="alert" className="text-error mt-1">
                {fieldErrors.amount}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="refund-reason" className="font-semibold block mb-1">
              Reason
            </label>
            <textarea
              id="refund-reason"
              rows={2}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={Boolean(fieldErrors.reason)}
              className={inputCls}
              placeholder="e.g. Returned product received in good condition"
            />
            {fieldErrors.reason && (
              <p role="alert" className="text-error mt-1">
                {fieldErrors.reason}
              </p>
            )}
          </div>
          {isCod ? (
            <div>
              <p className="p-3 bg-warning-bg text-warning border border-warning-line rounded-md mb-2">
                This money was collected in cash. Nothing is sent automatically: transfer the money to the customer yourself first, then record the bank / UPI
                reference here.
              </p>
              <label htmlFor="refund-reference" className="font-semibold block mb-1">
                Bank / UPI transfer reference
              </label>
              <input
                id="refund-reference"
                value={reference}
                maxLength={120}
                onChange={(e) => setReference(e.target.value)}
                aria-invalid={Boolean(fieldErrors.reference)}
                className={inputCls}
              />
              {fieldErrors.reference && (
                <p role="alert" className="text-error mt-1">
                  {fieldErrors.reference}
                </p>
              )}
            </div>
          ) : (
            <p className="p-3 bg-info-bg text-info border border-info-line rounded-md">
              The refund is sent to the payment provider. It can stay Pending until the provider confirms it; the customer is told once it completes.
            </p>
          )}
          {error && (
            <p role="alert" className="text-error">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold">
              {locked ? "Close" : "Cancel"}
            </button>
            <button type="submit" disabled={locked} className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50">
              Review refund
            </button>
          </div>
        </form>
      )}
    </AdminDialog>
  );
}
