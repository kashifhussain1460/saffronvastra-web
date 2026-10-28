"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AdminDialog,
  Pill,
  RefundDialog,
  money,
  paymentBadgeClass,
  providerLabel,
  readError,
  reasonLabel,
  requestBadgeClass,
  typeLabel,
  when,
  type RefundablePayment,
} from "@/components/admin/payments-shared";

type LoadState = "loading" | "ready" | "notfound" | "error";
type Action = "approve" | "reject" | "receive" | "complete";

const defaultPayer = (reasonCode: string): "CUSTOMER" | "SELLER" => (reasonCode === "CHANGE_OF_MIND" || reasonCode === "SIZE_ISSUE" ? "CUSTOMER" : "SELLER");

export default function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [request, setRequest] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  const [dialog, setDialog] = useState<null | "approve" | "reject" | "complete" | "refund">(null);
  const [gallery, setGallery] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [payer, setPayer] = useState<"CUSTOMER" | "SELLER">("SELLER");
  const [resolution, setResolution] = useState<"REFUND" | "EXCHANGE">("REFUND");
  const [dialogError, setDialogError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/requests/${encodeURIComponent(id)}`, { credentials: "include" });
      if (res.status === 404) {
        setLoadState("notfound");
        return;
      }
      if (!res.ok) {
        setLoadState("error");
        return;
      }
      const body = await res.json();
      setRequest(body.data);
      setLoadState("ready");
      // the order has the per-payment refundable amounts the refund form needs
      const orderRes = await fetch(`/api/v1/admin/orders/${encodeURIComponent(body.data.orderSummary?.orderNumber || body.data.orderId)}`, { credentials: "include" }).catch(() => null);
      if (orderRes?.ok) setOrder((await orderRes.json()).data);
    } catch {
      setLoadState("error");
    }
  }, [id]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  // the sidebar badge counts requests waiting for review
  const announce = () => window.dispatchEvent(new Event("admin-requests-changed"));

  const run = async (action: Action, body: Record<string, unknown> = {}): Promise<boolean> => {
    if (sending.current) return false;
    sending.current = true;
    setBusy(true);
    setActionError("");
    setDialogError("");
    try {
      const res = await fetch(`/api/v1/admin/requests/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await readError(res, "The request could not be updated.");
        setActionError(err.message);
        setDialogError(err.message);
        await load();
        return false;
      }
      setNotice(
        { approve: "Request approved.", reject: "Request rejected. The customer has been told why.", receive: "Marked as received.", complete: "Request completed." }[action]
      );
      await load();
      announce();
      return true;
    } catch {
      const message = "Network error: nothing was changed. Please try again.";
      setActionError(message);
      setDialogError(message);
      return false;
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  if (loadState !== "ready" || !request) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-3 font-sans">
        <Link href="/admin/returns" className="text-xs text-primary hover:underline">
          &larr; Back to returns
        </Link>
        {loadState === "loading" && (
          <p role="status" className="text-sm text-ink-muted">
            Loading request...
          </p>
        )}
        {loadState === "notfound" && (
          <p role="alert" className="text-sm text-ink">
            This request does not exist.
          </p>
        )}
        {loadState === "error" && (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-ink">The request could not be loaded.</p>
            <button
              type="button"
              onClick={() => {
                setLoadState("loading");
                void load();
              }}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  const allowed: string[] = request.allowedActions || [];
  const isCancellation = request.type === "CANCELLATION";
  const evidence: string[] = request.evidence || [];
  const summary = request.orderSummary || {};
  const orderRef = summary.orderNumber;
  const refundablePayments: RefundablePayment[] = (order?.payments || [])
    .filter((p: any) => p.status === "SUCCESS" && p.refundableMinor > 0)
    .map((p: any) => ({ id: p.id, provider: p.provider, amountMinor: p.amountMinor, refundableMinor: p.refundableMinor, providerOrderId: p.providerOrderId }));
  const canRefund = ["Approved", "Received", "Completed"].includes(request.status) && refundablePayments.length > 0;
  const toRefund = Math.max(0, (request.suggestedRefundMinor || 0) - (request.refundedMinor || 0));
  const hasActions = allowed.includes("Approved") || allowed.includes("Rejected") || allowed.includes("Received") || allowed.includes("Completed") || canRefund;

  const openApprove = () => {
    setNote("");
    setDialogError("");
    setPayer(request.returnShippingPayer || defaultPayer(request.reasonCode));
    setResolution(request.type === "EXCHANGE" ? "EXCHANGE" : request.resolution === "EXCHANGE" ? "EXCHANGE" : "REFUND");
    setDialog("approve");
  };
  const openReject = () => {
    setNote("");
    setDialogError("");
    setDialog("reject");
  };
  const openComplete = () => {
    setNote("");
    setDialogError("");
    setDialog("complete");
  };

  const inputCls = "w-full p-2 border border-line rounded-md bg-canvas text-xs text-ink";
  const card = "bg-surface p-5 rounded-xl border border-line shadow-2xs";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link href="/admin/returns" className="hover:text-primary-hover transition-colors">
            Returns
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink font-medium">{request.requestNumber}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
            {typeLabel(request.type)} request {request.requestNumber}
          </h1>
          <Pill className={requestBadgeClass(request.status)} data-testid="request-status">
            {request.status}
          </Pill>
          {request.outsideWindow && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-warning-bg text-warning border-warning-line" data-testid="outside-window">
              Outside window
            </span>
          )}
        </div>
        <p className="text-xs text-ink-muted">
          Raised on <span className="text-ink font-medium">{when(request.createdAt)}</span>
        </p>
      </div>

      {actionError && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between gap-3">
          <span>{actionError}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setActionError("")} className="font-bold">
            ×
          </button>
        </div>
      )}
      {notice && !actionError && (
        <div role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice("")} className="font-bold">
            ×
          </button>
        </div>
      )}
      {request.outsideWindow && (
        <div className="p-3 bg-warning-bg border border-warning-line text-warning rounded-md text-xs">
          This request was raised after the 7-day return window. It was accepted for individual review because of the reason given (defective, damaged, incorrect or not as described).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Items */}
          <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-line">
              <h2 className="font-serif text-lg text-ink">{isCancellation ? "Order being cancelled" : "Items"}</h2>
            </div>
            {request.items.length === 0 ? (
              <p className="p-5 text-xs text-ink-muted">This request covers the whole order.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-canvas text-ink-muted border-b border-line font-medium">
                    <tr>
                      <th className="p-4 font-semibold text-ink">Product</th>
                      <th className="p-4 font-semibold text-ink">Size</th>
                      <th className="p-4 font-semibold text-ink">Colour</th>
                      <th className="p-4 font-semibold text-ink text-center">Qty</th>
                      {request.type === "EXCHANGE" && <th className="p-4 font-semibold text-ink">Exchange for size</th>}
                      <th className="p-4 font-semibold text-ink text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {request.items.map((line: any) => (
                      <tr key={line.id || line.orderItemId} data-testid="request-item">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 rounded-md overflow-hidden border border-line bg-surface-muted shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={line.orderItem?.productImage || "/images/brand/saffronvastra-mark.png"} alt={line.orderItem?.productTitle || "Product"} className="w-full h-full object-cover" />
                            </div>
                            <p className="font-semibold text-ink">{line.orderItem?.productTitle}</p>
                          </div>
                        </td>
                        <td className="p-4 text-ink-secondary">{line.orderItem?.size}</td>
                        <td className="p-4 text-ink-secondary">{line.orderItem?.colour}</td>
                        <td className="p-4 text-center font-medium text-ink">{line.quantity}</td>
                        {request.type === "EXCHANGE" && <td className="p-4 text-ink font-medium">{line.exchangeSize || "-"}</td>}
                        <td className="p-4 text-right text-ink">{money(line.orderItem?.unitPriceMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer's account */}
          <div className={`${card} space-y-4`}>
            <h2 className="font-serif text-lg text-ink">Customer&apos;s request</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-ink-muted">Reason</dt>
                <dd className="font-medium text-ink mt-0.5">{reasonLabel(request.reasonCode)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">What the customer wants</dt>
                <dd className="font-medium text-ink mt-0.5">{request.type === "CANCELLATION" ? "Cancel the order" : request.type === "EXCHANGE" ? "Exchange for another size" : "Return for a refund"}</dd>
              </div>
            </dl>
            <div className="text-xs">
              <p className="text-ink-muted">Description</p>
              {request.details ? <p className="mt-1 text-ink whitespace-pre-wrap" data-testid="request-details">{request.details}</p> : <p className="mt-1 text-ink-muted">The customer did not add a description.</p>}
            </div>
            <div className="text-xs">
              <p className="text-ink-muted">Photos ({evidence.length})</p>
              {evidence.length === 0 ? (
                <p className="mt-1 text-ink-muted">No photos were attached.</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2" data-testid="evidence-gallery">
                  {evidence.map((url, i) => (
                    <li key={url}>
                      <button
                        type="button"
                        onClick={() => setGallery(i)}
                        aria-label={`Open photo ${i + 1} of ${evidence.length}`}
                        className="block w-20 h-20 rounded-md overflow-hidden border border-line bg-surface-muted hover:border-primary"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Customer photo ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className={card}>
            <h2 className="font-serif text-lg text-ink mb-6">Timeline</h2>
            {request.events.length === 0 ? (
              <p className="text-xs text-ink-muted">No events recorded yet.</p>
            ) : (
              <ol className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-line" data-testid="request-timeline">
                {request.events.map((e: any) => (
                  <li key={e.id || `${e.toStatus}-${e.createdAt}`} className="relative">
                    <span aria-hidden="true" className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary ring-4 ring-surface" />
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <p className="text-xs font-semibold text-ink">
                        {e.fromStatus ? `${e.fromStatus} → ${e.toStatus}` : e.toStatus}
                      </p>
                      <p className="text-[11px] text-ink-muted">{when(e.createdAt)}</p>
                    </div>
                    {e.note && <p className="text-xs text-ink-secondary mt-0.5 whitespace-pre-wrap">{e.note}</p>}
                    <p className="text-[11px] text-ink-muted mt-0.5">{e.actorRole === "ADMIN" ? "By staff" : e.actorRole === "CUSTOMER" ? "By the customer" : e.actorRole || "System"}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Actions */}
          <div className={`${card} space-y-3`} data-testid="request-actions">
            <h2 className="font-serif text-lg text-ink">Actions</h2>
            {!hasActions && <p className="text-xs text-ink-muted">No further action is possible on this request.</p>}
            <div className="flex flex-col gap-2">
              {allowed.includes("Approved") && (
                <button type="button" disabled={busy} onClick={openApprove} className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50">
                  Approve
                </button>
              )}
              {allowed.includes("Rejected") && (
                <button type="button" disabled={busy} onClick={openReject} className="px-4 py-2 bg-surface text-error border border-error-line rounded-md text-xs font-semibold hover:bg-error-bg disabled:opacity-50">
                  Reject
                </button>
              )}
              {allowed.includes("Received") && (
                <button type="button" disabled={busy} onClick={() => void run("receive")} className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50">
                  {busy ? "Saving..." : "Mark as received"}
                </button>
              )}
              {canRefund && (
                <button type="button" disabled={busy} onClick={() => setDialog("refund")} className="px-4 py-2 bg-surface text-primary border border-primary rounded-md text-xs font-semibold hover:bg-primary-hover hover:text-on-primary disabled:opacity-50">
                  Issue refund
                </button>
              )}
              {allowed.includes("Completed") && (
                <button type="button" disabled={busy} onClick={openComplete} className="px-4 py-2 bg-surface text-ink border border-line rounded-md text-xs font-semibold hover:bg-ink/5 disabled:opacity-50">
                  Complete
                </button>
              )}
            </div>
            {request.status === "Requested" && <p className="text-[11px] text-ink-muted">The customer may still withdraw this request until it is approved or rejected.</p>}
            {request.type === "RETURN" && request.status === "Approved" && (
              <p className="text-[11px] text-ink-muted">Mark the product as received when it arrives back, issue the refund, then complete the request.</p>
            )}
          </div>

          {/* Customer and order */}
          <div className={`${card} space-y-3`}>
            <h2 className="font-serif text-lg text-ink">Customer &amp; order</h2>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-ink">{request.customer?.name}</p>
              {request.customer?.email && <p className="text-ink-secondary break-all">{request.customer.email}</p>}
              {request.customer?.phone && <p className="text-ink-secondary">{request.customer.phone}</p>}
            </div>
            <div className="pt-3 border-t border-line text-xs space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">Order</span>
                <Link href={`/admin/orders/${orderRef}`} className="font-semibold text-primary hover:underline">
                  #{orderRef}
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">Order status</span>
                <span className="text-ink">{summary.status}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">Payment</span>
                <span className="text-ink">
                  {providerLabel(summary.paymentProvider)}, {summary.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">Order total</span>
                <span className="font-semibold text-ink">{money(summary.totalMinor)}</span>
              </div>
            </div>
          </div>

          {/* Decision */}
          <div className={`${card} space-y-3`}>
            <h2 className="font-serif text-lg text-ink">Decision</h2>
            <dl className="text-xs space-y-2">
              {!isCancellation && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Resolution</dt>
                  <dd className="text-ink">{request.resolution === "EXCHANGE" ? "Exchange" : request.resolution === "REFUND" ? "Refund" : "Not decided"}</dd>
                </div>
              )}
              {!isCancellation && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Return shipping paid by</dt>
                  <dd className="text-ink">{request.returnShippingPayer === "CUSTOMER" ? "Customer" : request.returnShippingPayer === "SELLER" ? "Us (the shop)" : "Not decided"}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink-muted">Note to the customer</dt>
                <dd className="text-ink mt-0.5 whitespace-pre-wrap">{request.decisionNote || "None yet"}</dd>
              </div>
            </dl>
          </div>

          {/* Refunds */}
          <div className={`${card} space-y-3`}>
            <h2 className="font-serif text-lg text-ink">Refunds</h2>
            {!isCancellation || request.suggestedRefundMinor ? (
              <p className="text-xs text-ink-secondary">
                Suggested refund: <span className="font-semibold text-ink">{money(request.suggestedRefundMinor)}</span>. Refunded so far:{" "}
                <span className="font-semibold text-ink">{money(request.refundedMinor)}</span>.
              </p>
            ) : null}
            {request.refunds.length === 0 ? (
              <p className="text-xs text-ink-muted">No refund has been recorded for this request.</p>
            ) : (
              <ul className="space-y-2" data-testid="request-refunds">
                {request.refunds.map((r: any) => (
                  <li key={r.id} className="text-xs border border-line rounded-md p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{money(r.amountMinor)}</span>
                      <Pill className={paymentBadgeClass(r.status)}>{r.status}</Pill>
                    </div>
                    <span className="text-ink-muted">
                      {r.method === "MANUAL" ? "Recorded by staff" : "Sent to payment provider"} · {when(r.createdAt)}
                    </span>
                    {r.manualReference && <span className="text-ink-secondary">Reference: {r.manualReference}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Approve */}
      {dialog === "approve" && (
        <AdminDialog title={`Approve ${request.requestNumber}`} onClose={() => !busy && setDialog(null)} dismissible={!busy} testId="approve-dialog">
          <form
            className="space-y-3 text-xs"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run("approve", {
                note: note.trim() || undefined,
                ...(isCancellation ? {} : { returnShippingPayer: payer, resolution }),
              });
              if (ok) setDialog(null);
            }}
          >
            {isCancellation ? (
              <p className="text-ink-secondary">Approving cancels the order. If the customer has already paid, a refund is then due.</p>
            ) : (
              <>
                <div>
                  <label htmlFor="approve-resolution" className="font-semibold block mb-1">
                    Resolution
                  </label>
                  <select id="approve-resolution" value={resolution} onChange={(e) => setResolution(e.target.value as "REFUND" | "EXCHANGE")} className={inputCls}>
                    <option value="REFUND">Refund</option>
                    <option value="EXCHANGE">Exchange</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="approve-payer" className="font-semibold block mb-1">
                    Who pays return shipping
                  </label>
                  <select id="approve-payer" value={payer} onChange={(e) => setPayer(e.target.value as "CUSTOMER" | "SELLER")} className={inputCls}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="SELLER">We do (the shop)</option>
                  </select>
                  <p className="text-ink-muted mt-1">
                    Suggested from the reason ({reasonLabel(request.reasonCode)}): {defaultPayer(request.reasonCode) === "CUSTOMER" ? "the customer pays for a change of mind or a size choice" : "we pay when the product is faulty or wrong"}.
                  </p>
                </div>
              </>
            )}
            <div>
              <label htmlFor="approve-note" className="font-semibold block mb-1">
                Note to the customer (optional)
              </label>
              <textarea id="approve-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
            </div>
            {dialogError && (
              <p role="alert" className="text-error">
                {dialogError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" disabled={busy} onClick={() => setDialog(null)} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-60">
                {busy ? "Approving..." : "Approve request"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}

      {/* Reject */}
      {dialog === "reject" && (
        <AdminDialog title={`Reject ${request.requestNumber}`} onClose={() => !busy && setDialog(null)} dismissible={!busy} testId="reject-dialog">
          <form
            className="space-y-3 text-xs"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (note.trim().length < 3) {
                setDialogError("Tell the customer why the request cannot be approved (at least 3 characters).");
                return;
              }
              const ok = await run("reject", { note: note.trim() });
              if (ok) setDialog(null);
            }}
          >
            <p className="text-ink-secondary">The customer is emailed and sees your note. Rejecting cannot be undone; they would need to raise a new request.</p>
            <div>
              <label htmlFor="reject-note" className="font-semibold block mb-1">
                Reason shown to the customer
              </label>
              <textarea
                id="reject-note"
                rows={4}
                maxLength={1000}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-invalid={Boolean(dialogError)}
                className={inputCls}
              />
            </div>
            {dialogError && (
              <p role="alert" className="text-error">
                {dialogError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" disabled={busy} onClick={() => setDialog(null)} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="px-4 py-1.5 bg-error text-on-primary rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-60">
                {busy ? "Rejecting..." : "Reject request"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}

      {/* Complete */}
      {dialog === "complete" && (
        <AdminDialog title={`Complete ${request.requestNumber}`} onClose={() => !busy && setDialog(null)} dismissible={!busy} testId="complete-dialog">
          <form
            className="space-y-3 text-xs"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run("complete", { note: note.trim() || undefined });
              if (ok) setDialog(null);
            }}
          >
            <p className="text-ink-secondary">Completing closes the request and emails the customer. A return with a refund resolution needs its refund recorded first.</p>
            <div>
              <label htmlFor="complete-note" className="font-semibold block mb-1">
                Note (optional)
              </label>
              <textarea id="complete-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
            </div>
            {dialogError && (
              <p role="alert" className="text-error">
                {dialogError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" disabled={busy} onClick={() => setDialog(null)} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-60">
                {busy ? "Completing..." : "Complete request"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}

      {/* Refund */}
      {dialog === "refund" && order && (
        <RefundDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          payments={refundablePayments}
          suggestedMinor={toRefund}
          requestId={request.id}
          defaultReason={`${typeLabel(request.type)} ${request.requestNumber}`}
          onClose={() => setDialog(null)}
          onChanged={() => void load()}
        />
      )}

      {/* Evidence gallery */}
      {gallery !== null && evidence[gallery] && <EvidenceDialog urls={evidence} index={gallery} onIndex={setGallery} onClose={() => setGallery(null)} />}
    </div>
  );
}

function EvidenceDialog({ urls, index, onIndex, onClose }: { urls: string[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const prev = () => onIndex((index - 1 + urls.length) % urls.length);
  const next = () => onIndex((index + 1) % urls.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, urls.length]);
  return (
    <AdminDialog title={`Customer photo ${index + 1} of ${urls.length}`} onClose={onClose} maxWidth="max-w-3xl" testId="evidence-dialog">
      <div className="bg-surface-muted rounded-md flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[index]} alt={`Customer photo ${index + 1} of ${urls.length}`} className="max-h-[60vh] max-w-full object-contain" />
      </div>
      {urls.length > 1 && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={prev} className="inline-flex items-center gap-1 px-3 py-1.5 border border-line rounded-md text-xs font-semibold">
            <ChevronLeft aria-hidden="true" className="w-3.5 h-3.5" />
            Previous
          </button>
          <button type="button" onClick={next} className="inline-flex items-center gap-1 px-3 py-1.5 border border-line rounded-md text-xs font-semibold">
            Next
            <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </AdminDialog>
  );
}
