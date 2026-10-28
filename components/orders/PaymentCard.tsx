"use client";

import React, { useRef, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { btnPrimary } from "@/components/auth/ui";
import { OrderPayment, apiJson, formatDay, formatMinor, paymentTone, providerLabel, toneClass } from "./shared";

interface Props {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  provider: string;
  totalMinor: number;
  collectedMinor: number;
  refundedMinor: number;
  refundDueMinor: number;
  payments: OrderPayment[];
  /** Called after something changed on the server (payment found already paid) so the page reloads the order. */
  onChanged: () => void;
}

const REFUND_STATUS_TEXT: Record<string, string> = {
  COMPLETED: "Refunded",
  PENDING: "Refund in progress",
  FAILED: "Refund failed, our team is looking into it",
};

export default function PaymentCard({
  orderNumber,
  orderStatus,
  paymentStatus,
  provider,
  totalMinor,
  collectedMinor,
  refundedMinor,
  refundDueMinor,
  payments,
  onChanged,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const lock = useRef(false);

  const online = provider === "CASHFREE";
  const cancelled = orderStatus === "Cancelled";
  const waiting = online && orderStatus === "Pending" && paymentStatus !== "Paid";
  const canPay = online && !cancelled && (paymentStatus === "Pending" || paymentStatus === "Failed");
  const hadFailure = paymentStatus === "Failed" || payments.some((p) => p.status === "FAILED" || p.status === "EXPIRED");
  const payLabel = hadFailure ? "Try payment again" : "Pay now";

  const statusText = (() => {
    if (online && paymentStatus === "Pending") return cancelled ? "Not paid" : "Waiting for payment";
    if (!online && paymentStatus === "Pending") return "To be paid on delivery";
    return paymentStatus || "Unknown";
  })();

  const refunds = payments.flatMap((p) => p.refunds || []);

  const startPayment = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const { res, body } = await apiJson(`/api/v1/orders/${encodeURIComponent(orderNumber)}/payment/start`, { method: "POST" });
      if (!res.ok) {
        setMessage({ kind: "error", text: body?.message || "We could not start the payment. Your order is saved, please try again." });
        return;
      }
      const data = body?.data;
      if (data?.alreadyPaid) {
        setMessage({ kind: "info", text: "We have already received your payment for this order." });
        onChanged();
        return;
      }
      if (!data?.paymentSessionId) {
        setMessage({ kind: "error", text: "We could not start the payment. Please try again." });
        return;
      }
      await openCashfreeCheckout(data.paymentSessionId, data.mode === "production" ? "production" : "sandbox");
    } catch (e: any) {
      setMessage({ kind: "error", text: e?.message || "The payment window could not be opened. Please try again." });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="payment-card-title" data-testid="payment-card" className="rounded-2xl border border-line p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="payment-card-title" className="font-heading text-xl font-medium text-ink flex items-center gap-2">
          {online ? <CreditCard className="w-5 h-5" aria-hidden="true" /> : <Wallet className="w-5 h-5" aria-hidden="true" />}
          Payment
        </h2>
        <span
          data-testid="payment-status-chip"
          className={`inline-flex items-center whitespace-nowrap rounded px-2.5 py-0.5 text-sm font-medium border ${toneClass(paymentTone(paymentStatus))}`}
        >
          {statusText}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 text-base">
        <div>
          <dt className="text-ink-secondary">Method</dt>
          <dd className="mt-1 font-semibold text-ink">{providerLabel(provider)}</dd>
        </div>
        <div>
          <dt className="text-ink-secondary">Order total</dt>
          <dd className="mt-1 font-semibold text-ink">{formatMinor(totalMinor)}</dd>
        </div>
        <div>
          <dt className="text-ink-secondary">Amount paid</dt>
          <dd className="mt-1 font-semibold text-ink">{formatMinor(collectedMinor)}</dd>
        </div>
      </dl>

      {waiting && (
        <p role="status" className="mt-4 text-base text-ink-secondary">
          Your order is waiting for payment. It is not confirmed until the payment is received.
        </p>
      )}
      {!online && paymentStatus === "Pending" && !cancelled && (
        <p className="mt-4 text-base text-ink-secondary">Pay the courier when your order arrives.</p>
      )}
      {hadFailure && canPay && (
        <p className="mt-4 text-base text-ink-secondary">The last payment attempt did not go through. You can try again.</p>
      )}

      {canPay && (
        <div className="mt-4">
          <button type="button" onClick={startPayment} disabled={busy} className={btnPrimary}>
            {busy ? "Opening payment..." : payLabel}
          </button>
        </div>
      )}
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm ${message.kind === "error" ? "text-error" : "text-ink-secondary"}`}>
          {message.text}
        </p>
      )}

      {refundDueMinor > 0 && (
        <p className="mt-4 rounded-lg bg-info-bg text-info border border-info-line px-4 py-3 text-base">
          This order was cancelled and {formatMinor(refundDueMinor)} will be returned to your original payment method after our team processes it.
        </p>
      )}

      {refunds.length > 0 && (
        <div className="mt-5">
          <h3 className="text-base font-semibold text-ink">
            Refunds{refundedMinor > 0 ? ` (${formatMinor(refundedMinor)} refunded so far)` : ""}
          </h3>
          <ul className="mt-2 divide-y divide-line border border-line rounded-lg">
            {refunds.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-base">
                <span className="font-medium text-ink">{formatMinor(r.amountMinor)}</span>
                <span className="text-ink-secondary">{REFUND_STATUS_TEXT[r.status] || r.status}</span>
                <span className="text-sm text-ink-muted">{formatDay(r.processedAt || r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
