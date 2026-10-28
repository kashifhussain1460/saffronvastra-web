"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle, Minus, Plus } from "lucide-react";
import Image from "next/image";
import AccountModal from "@/components/account/AccountModal";
import { btnPrimary, btnSmall, btnSmallOutline, inputClass, labelClass, textareaClass } from "@/components/auth/ui";
import EvidenceUploader, { UploadedPhoto } from "./EvidenceUploader";
import {
  DETAILS_REQUIRED,
  MAX_DETAILS,
  MIN_DETAILS,
  REASON_LABELS,
  REMEDY_REASONS,
  RequestType,
  TYPE_LABELS,
  apiJson,
  formatDay,
} from "./shared";

interface EligibilityItem {
  orderItemId: string;
  title: string;
  image?: string | null;
  size?: string | null;
  colour?: string | null;
  purchased: number;
  alreadyRequested: number;
  available: number;
  exchangeSizes: string[];
}

interface Eligibility {
  orderNumber: string;
  orderStatus: string;
  canCancel: boolean;
  cancelNote?: string | null;
  canReturn: boolean;
  deliveredAt?: string | null;
  windowEndsAt?: string | null;
  withinWindow: boolean;
  returnWindowDays: number;
  afterWindowNote?: string | null;
  items: EligibilityItem[];
}

type Errors = Partial<Record<"type" | "reason" | "details" | "items" | "form" | string, string>>;

const CANCEL_REASONS = ["CHANGE_OF_MIND", "SIZE_ISSUE", "OTHER"];
const RETURN_REASONS = ["CHANGE_OF_MIND", "SIZE_ISSUE", "DEFECTIVE", "DAMAGED", "INCORRECT", "NOT_AS_DESCRIBED", "OTHER"];

export default function RequestDialog({
  open,
  onClose,
  orderNumber,
  initialMode,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  orderNumber: string;
  initialMode: "cancel" | "return";
  onSubmitted: () => void;
}) {
  const uid = useId();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadMessage, setLoadMessage] = useState("");
  const [elig, setElig] = useState<Eligibility | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [type, setType] = useState<RequestType | "">("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ requestNumber: string; type: RequestType } | null>(null);
  const lock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Start fresh every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDone(null);
    setErrors({});
    setReason("");
    setDetails("");
    setQty({});
    setSizes({});
    setPhotos([]);
    setType("");
    lock.current = false;
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const { res, body } = await apiJson(`/api/v1/orders/${encodeURIComponent(orderNumber)}/requests/eligibility`);
        if (cancelled) return;
        if (!res.ok || !body?.data) {
          setLoadMessage(body?.message || "We could not check what you can request for this order.");
          setState("error");
          return;
        }
        const data = body.data as Eligibility;
        setElig(data);
        setType((t) => t || (initialMode === "cancel" ? (data.canCancel ? "CANCELLATION" : data.canReturn ? "RETURN" : "") : data.canReturn ? "RETURN" : data.canCancel ? "CANCELLATION" : ""));
        setState("ready");
      } catch {
        if (!cancelled) {
          setLoadMessage("Network error. Please check your connection.");
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, orderNumber, reloadKey, initialMode]);

  const isCancel = type === "CANCELLATION";
  const afterWindow = !!elig && elig.orderStatus === "Delivered" && !elig.withinWindow;
  const reasonOptions = (isCancel ? CANCEL_REASONS : RETURN_REASONS).map((code) => ({
    code,
    label: REASON_LABELS[code],
    disabled: !isCancel && afterWindow && !REMEDY_REASONS.has(code),
  }));
  const detailsNeeded = DETAILS_REQUIRED.has(reason);
  const trimmedLen = details.trim().length;
  const selectedCount = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty]);

  const setQuantity = (id: string, value: number, max: number) => {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, value)) }));
    setErrors((e) => ({ ...e, items: undefined, form: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!type) e.type = "Choose what you would like to do.";
    if (!reason) e.reason = "Choose a reason.";
    else if (!isCancel && afterWindow && !REMEDY_REASONS.has(reason))
      e.reason = "The 7-day return period has ended. Only a defective, damaged, incorrect or not-as-described product can still be reported.";
    if (detailsNeeded && trimmedLen < MIN_DETAILS) e.details = `Please describe the problem in at least ${MIN_DETAILS} characters (${trimmedLen} so far).`;
    if (trimmedLen > MAX_DETAILS) e.details = `Please keep the description under ${MAX_DETAILS} characters.`;
    if (type === "RETURN" || type === "EXCHANGE") {
      if (selectedCount < 1) e.items = "Choose at least one item and how many pieces.";
      if (type === "EXCHANGE") {
        for (const it of elig?.items || []) {
          if ((qty[it.orderItemId] || 0) > 0 && !sizes[it.orderItemId]) e[`size-${it.orderItemId}`] = "Choose the size you want instead.";
        }
      }
    }
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current || uploadBusy) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.focus();
      });
      return;
    }
    lock.current = true;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        reasonCode: reason,
        ...(trimmedLen > 0 ? { details: details.trim() } : {}),
        ...(photos.length ? { evidence: photos.map((p) => p.url) } : {}),
      };
      if (type !== "CANCELLATION") {
        payload.items = (elig?.items || [])
          .filter((it) => (qty[it.orderItemId] || 0) > 0)
          .map((it) => ({
            orderItemId: it.orderItemId,
            quantity: qty[it.orderItemId],
            ...(type === "EXCHANGE" ? { exchangeSize: sizes[it.orderItemId] } : {}),
          }));
      }
      const { res, body } = await apiJson(`/api/v1/orders/${encodeURIComponent(orderNumber)}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = body?.message || "We could not send your request. Please try again.";
        if (body?.code === "DETAILS_REQUIRED") setErrors({ details: message });
        else setErrors({ form: message });
        lock.current = false;
        setSubmitting(false);
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ block: "nearest" }));
        return;
      }
      setDone({ requestNumber: body.data.requestNumber, type: body.data.type });
      setSubmitting(false);
      onSubmitted();
    } catch {
      setErrors({ form: "Network error: your request was not sent. Please try again." });
      lock.current = false;
      setSubmitting(false);
    }
  };

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);
  const title = done ? "Request sent" : initialMode === "cancel" ? "Cancel order" : "Return or exchange";

  return (
    <AccountModal open={open} onClose={onClose} title={title} size="lg">
      {state === "loading" && (
        <p role="status" className="py-8 text-center text-base text-ink-secondary">
          Checking what is possible for this order...
        </p>
      )}

      {state === "error" && (
        <div className="py-4 text-center space-y-4">
          <p role="alert" className="text-base text-ink-secondary">
            {loadMessage}
          </p>
          <button type="button" onClick={retry} className={btnSmall}>
            Try again
          </button>
        </div>
      )}

      {state === "ready" && elig && done && (
        <div className="text-center space-y-4" data-testid="request-success">
          <div className="w-12 h-12 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <p role="status" className="text-base text-ink">
            We have received your {done.type === "CANCELLATION" ? "cancellation" : done.type === "EXCHANGE" ? "exchange" : "return"} request.
            <br />
            Your request number is <strong data-testid="request-number">{done.requestNumber}</strong>.
          </p>
          <div className="rounded-xl bg-surface-muted p-4 text-left text-base text-ink-secondary space-y-2">
            <p className="font-semibold text-ink">What happens next</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Our team will review your request and write to you with the decision.</li>
              {done.type !== "CANCELLATION" && <li>Please do not send the product back until you hear from us.</li>}
              <li>Nothing is refunded automatically. If a refund applies, it goes back to your original payment method once approved.</li>
            </ul>
          </div>
          <button type="button" onClick={onClose} className={btnPrimary}>
            Done
          </button>
        </div>
      )}

      {state === "ready" && elig && !done && !elig.canCancel && !elig.canReturn && (
        <div className="space-y-4">
          {elig.cancelNote && <p className="text-base text-ink-secondary">{elig.cancelNote}</p>}
          {elig.afterWindowNote && <p className="text-base text-ink-secondary">{elig.afterWindowNote}</p>}
          {elig.orderStatus === "Delivered" && !elig.cancelNote?.includes("already open") && (
            <p className="text-base text-ink-secondary">Every piece in this order already has a request, so there is nothing more to raise here.</p>
          )}
          <button type="button" onClick={onClose} className={btnSmallOutline}>
            Close
          </button>
        </div>
      )}

      {state === "ready" && elig && !done && (elig.canCancel || elig.canReturn) && (
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
          <p className="text-sm text-ink-muted">Order #{elig.orderNumber}</p>

          {/* Window explanation */}
          {elig.orderStatus === "Delivered" && (
            <div className="rounded-lg bg-surface-muted p-4 text-base text-ink-secondary" data-testid="window-note">
              {elig.withinWindow ? (
                <p>
                  You can return or exchange items within {elig.returnWindowDays} days of delivery
                  {elig.windowEndsAt ? `, which is until ${formatDay(elig.windowEndsAt)}` : ""}.
                </p>
              ) : (
                <p>{elig.afterWindowNote || "The 7-day return period has ended."}</p>
              )}
            </div>
          )}
          {elig.canCancel && elig.cancelNote && <p className="text-sm text-ink-secondary">{elig.cancelNote}</p>}

          {/* Type */}
          <fieldset aria-describedby={errors.type ? `${uid}-type-err` : undefined}>
            <legend className={labelClass}>What would you like to do?</legend>
            <div className="space-y-2">
              {([
                elig.canCancel ? "CANCELLATION" : null,
                elig.canReturn ? "RETURN" : null,
                elig.canReturn ? "EXCHANGE" : null,
              ].filter(Boolean) as RequestType[]).map((t) => (
                <label key={t} className="flex items-center gap-3 min-h-[44px] cursor-pointer text-base text-ink">
                  <input
                    type="radio"
                    name={`${uid}-type`}
                    value={t}
                    checked={type === t}
                    aria-invalid={errors.type ? "true" : undefined}
                    onChange={() => {
                      setType(t);
                      setReason("");
                      setErrors({});
                    }}
                    className="w-5 h-5 accent-primary"
                  />
                  {TYPE_LABELS[t]}
                </label>
              ))}
            </div>
            {errors.type && (
              <p id={`${uid}-type-err`} role="alert" className="mt-1.5 text-sm text-error">
                {errors.type}
              </p>
            )}
          </fieldset>

          {/* Items */}
          {(type === "RETURN" || type === "EXCHANGE") && (
            <fieldset aria-describedby={errors.items ? `${uid}-items-err` : undefined}>
              <legend className={labelClass}>Which items, and how many?</legend>
              <ul className="divide-y divide-line border border-line rounded-lg">
                {elig.items.map((it) => {
                  const q = qty[it.orderItemId] || 0;
                  const exchangeBlocked = type === "EXCHANGE" && it.exchangeSizes.length === 0;
                  const unavailable = it.available < 1 || exchangeBlocked;
                  const sizeErr = errors[`size-${it.orderItemId}`];
                  return (
                    <li key={it.orderItemId} className="p-3 sm:p-4 space-y-3" data-testid="request-item">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-[70px] shrink-0 overflow-hidden rounded bg-surface-muted">
                          {it.image && <Image src={it.image} alt="" fill sizes="56px" className="object-cover object-top" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium text-ink line-clamp-2">{it.title}</p>
                          <p className="text-sm text-ink-secondary">
                            {[it.size && `Size ${it.size}`, it.colour, `Ordered ${it.purchased}`].filter(Boolean).join(" • ")}
                          </p>
                          {it.alreadyRequested > 0 && <p className="text-sm text-ink-muted">{it.alreadyRequested} already in a request</p>}
                          {exchangeBlocked && it.available > 0 && <p className="text-sm text-ink-muted">No other size is available for this piece.</p>}
                        </div>
                        <div role="group" aria-label={`Quantity for ${it.title}`} className="flex items-center shrink-0">
                          <button
                            type="button"
                            aria-label={`Fewer ${it.title}`}
                            disabled={unavailable || q <= 0}
                            onClick={() => setQuantity(it.orderItemId, q - 1, it.available)}
                            className="w-11 h-11 rounded-full border border-line-strong flex items-center justify-center text-ink disabled:opacity-40"
                          >
                            <Minus className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <span data-testid="request-qty" aria-live="polite" className="w-10 text-center text-base font-semibold text-ink">
                            {q}
                          </span>
                          <button
                            type="button"
                            aria-label={`More ${it.title}`}
                            disabled={unavailable || q >= it.available}
                            onClick={() => setQuantity(it.orderItemId, q + 1, it.available)}
                            className="w-11 h-11 rounded-full border border-line-strong flex items-center justify-center text-ink disabled:opacity-40"
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {it.available > 0 && <p className="text-sm text-ink-muted">Up to {it.available} can be requested.</p>}
                      {type === "EXCHANGE" && q > 0 && it.exchangeSizes.length > 0 && (
                        <div>
                          <label htmlFor={`${uid}-size-${it.orderItemId}`} className={labelClass}>
                            Exchange for size
                          </label>
                          <select
                            id={`${uid}-size-${it.orderItemId}`}
                            value={sizes[it.orderItemId] || ""}
                            aria-invalid={sizeErr ? "true" : undefined}
                            aria-describedby={sizeErr ? `${uid}-size-err-${it.orderItemId}` : undefined}
                            onChange={(e) => {
                              setSizes((s) => ({ ...s, [it.orderItemId]: e.target.value }));
                              setErrors((er) => ({ ...er, [`size-${it.orderItemId}`]: undefined }));
                            }}
                            className={inputClass(!!sizeErr)}
                          >
                            <option value="">Choose a size</option>
                            {it.exchangeSizes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {sizeErr && (
                            <p id={`${uid}-size-err-${it.orderItemId}`} role="alert" className="mt-1.5 text-sm text-error">
                              {sizeErr}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {errors.items && (
                <p id={`${uid}-items-err`} role="alert" aria-live="assertive" className="mt-1.5 text-sm text-error">
                  {errors.items}
                </p>
              )}
            </fieldset>
          )}

          {/* Reason */}
          {type && (
            <div>
              <label htmlFor={`${uid}-reason`} className={labelClass}>
                Reason
              </label>
              <select
                id={`${uid}-reason`}
                value={reason}
                aria-invalid={errors.reason ? "true" : undefined}
                aria-describedby={errors.reason ? `${uid}-reason-err` : undefined}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors((er) => ({ ...er, reason: undefined, details: undefined }));
                }}
                className={inputClass(!!errors.reason)}
              >
                <option value="">Choose a reason</option>
                {reasonOptions.map((o) => (
                  <option key={o.code} value={o.code} disabled={o.disabled}>
                    {o.label}
                    {o.disabled ? " (not available after 7 days)" : ""}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p id={`${uid}-reason-err`} role="alert" className="mt-1.5 text-sm text-error">
                  {errors.reason}
                </p>
              )}
            </div>
          )}

          {/* Details */}
          {type && (
            <div>
              <label htmlFor={`${uid}-details`} className={labelClass}>
                {detailsNeeded ? "Tell us what happened" : "Anything else we should know? (optional)"}
              </label>
              <textarea
                id={`${uid}-details`}
                rows={4}
                maxLength={MAX_DETAILS}
                value={details}
                aria-required={detailsNeeded}
                aria-invalid={errors.details ? "true" : undefined}
                aria-describedby={`${uid}-details-hint${errors.details ? ` ${uid}-details-err` : ""}`}
                onChange={(e) => {
                  setDetails(e.target.value);
                  setErrors((er) => ({ ...er, details: undefined }));
                }}
                className={`${textareaClass} ${errors.details ? "border-error" : ""}`}
              />
              <p id={`${uid}-details-hint`} className="mt-1.5 text-sm text-ink-secondary">
                {detailsNeeded
                  ? trimmedLen >= MIN_DETAILS
                    ? `${trimmedLen} characters`
                    : `At least ${MIN_DETAILS} characters needed (${trimmedLen} so far)`
                  : `${trimmedLen} of ${MAX_DETAILS} characters`}
              </p>
              {errors.details && (
                <p id={`${uid}-details-err`} role="alert" className="mt-1 text-sm text-error">
                  {errors.details}
                </p>
              )}
            </div>
          )}

          {/* Photos */}
          {type && type !== "CANCELLATION" && <EvidenceUploader photos={photos} onChange={setPhotos} onBusyChange={setUploadBusy} />}

          {type && type !== "CANCELLATION" && (
            <p className="text-sm text-ink-secondary">
              Refunds are never automatic: our team reviews every request. Please do not send anything back until you hear from us.
            </p>
          )}

          {errors.form && (
            <p role="alert" data-testid="request-form-error" className="rounded-lg bg-error-bg text-error border border-error-line px-4 py-3 text-base">
              {errors.form}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={submitting || uploadBusy} className={btnPrimary}>
              {submitting ? "Sending..." : isCancel ? "Send cancellation request" : type === "EXCHANGE" ? "Send exchange request" : "Send return request"}
            </button>
            <button type="button" onClick={onClose} className={btnSmallOutline}>
              Close
            </button>
          </div>
        </form>
      )}
    </AccountModal>
  );
}
