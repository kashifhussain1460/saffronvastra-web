"use client";

import React, { useRef, useState } from "react";
import AccountModal from "@/components/account/AccountModal";
import { btnPrimary, btnSmallOutline } from "@/components/auth/ui";
import {
  OrderRequestData,
  REASON_LABELS,
  REQUEST_STATUS_TEXT,
  TYPE_LABELS,
  apiJson,
  formatDay,
  requestTone,
  toneClass,
} from "./shared";

interface ItemLookup {
  [orderItemId: string]: { title: string; size?: string };
}

const SHIPPING_TEXT: Record<string, string> = {
  CUSTOMER: "Return shipping is paid by you for a change of mind or size return.",
  SELLER: "We cover reasonable return shipping.",
};

const NEXT_STEP: Record<string, string> = {
  Requested: "Our team is reviewing this request. Please do not send the product back until you hear from us.",
  Approved: "Approved. Follow the instructions from our team to send the product back.",
  Received: "We have received your items and are processing the outcome.",
};

export default function RequestTimeline({
  orderNumber,
  requests,
  items,
  onChanged,
}: {
  orderNumber: string;
  requests: OrderRequestData[];
  items: ItemLookup;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState<OrderRequestData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  const withdraw = async () => {
    if (!confirming || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { res, body } = await apiJson(
        `/api/v1/orders/${encodeURIComponent(orderNumber)}/requests/${encodeURIComponent(confirming.id)}/withdraw`,
        { method: "POST" }
      );
      if (!res.ok) {
        setError(body?.message || "We could not withdraw this request. Please try again.");
        return;
      }
      setConfirming(null);
      onChanged();
    } catch {
      setError("Network error: the request was not withdrawn. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const sorted = [...requests].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <section aria-labelledby="requests-title" data-testid="requests-section" className="rounded-2xl border border-line p-4 sm:p-6">
      <h2 id="requests-title" className="font-heading text-xl font-medium text-ink">
        Cancellation, return and exchange requests
      </h2>
      <ul className="mt-4 space-y-4">
        {sorted.map((r) => (
          <li key={r.id} data-testid="request-card" className="rounded-xl border border-line p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-ink">
                <span data-testid="request-card-number">{r.requestNumber}</span> &bull; {TYPE_LABELS[r.type] || r.type}
              </p>
              <span className={`inline-flex items-center whitespace-nowrap rounded px-2.5 py-0.5 text-sm font-medium border ${toneClass(requestTone(r.status))}`}>
                {REQUEST_STATUS_TEXT[r.status] || r.status}
              </span>
            </div>
            <p className="text-sm text-ink-muted">Sent on {formatDay(r.createdAt)}</p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-base">
              <div>
                <dt className="text-ink-secondary">Reason</dt>
                <dd className="font-medium text-ink">{REASON_LABELS[r.reasonCode] || r.reasonCode}</dd>
              </div>
              {r.items?.length > 0 && (
                <div>
                  <dt className="text-ink-secondary">Items</dt>
                  <dd className="font-medium text-ink">
                    <ul>
                      {r.items.map((it) => (
                        <li key={it.orderItemId}>
                          {items[it.orderItemId]?.title || "Item"} x {it.quantity}
                          {it.exchangeSize ? ` (exchange for size ${it.exchangeSize})` : ""}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {r.details && (
                <div className="sm:col-span-2">
                  <dt className="text-ink-secondary">Your note</dt>
                  <dd className="text-ink break-words">{r.details}</dd>
                </div>
              )}
            </dl>

            {r.outsideWindow && (
              <p className="text-sm text-ink-secondary">This request is outside the 7-day window, so it is reviewed individually.</p>
            )}

            {r.decisionNote && (
              <div className="rounded-lg bg-surface-muted p-3 text-base">
                <p className="text-sm font-semibold text-ink">Message from our team</p>
                <p className="text-ink-secondary whitespace-pre-line break-words">{r.decisionNote}</p>
              </div>
            )}

            {NEXT_STEP[r.status] && <p className="text-base text-ink-secondary">{NEXT_STEP[r.status]}</p>}

            {r.returnShippingPayer && r.type !== "CANCELLATION" && ["Approved", "Received", "Completed"].includes(r.status) && (
              <p className="text-base text-ink-secondary" data-testid="shipping-payer">
                {SHIPPING_TEXT[r.returnShippingPayer]}
              </p>
            )}

            {r.status === "Completed" && r.type !== "CANCELLATION" && r.resolution === "REFUND" && (
              <p className="text-base text-ink-secondary">The refund goes to your original payment method. See the Refunds list in the Payment section above.</p>
            )}
            {r.status === "Completed" && r.resolution === "EXCHANGE" && (
              <p className="text-base text-ink-secondary">Your exchange has been arranged by our team.</p>
            )}

            {r.status === "Requested" && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setConfirming(r);
                }}
                className={btnSmallOutline}
              >
                Withdraw request
              </button>
            )}
          </li>
        ))}
      </ul>

      <AccountModal open={!!confirming} onClose={() => (busy ? undefined : setConfirming(null))} title="Withdraw this request?">
        <p className="text-base text-ink-secondary">
          Request {confirming?.requestNumber} will be cancelled and our team will not act on it. You can send a new request afterwards if you still need one.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={withdraw} disabled={busy} className={btnPrimary}>
            {busy ? "Withdrawing..." : "Yes, withdraw it"}
          </button>
          <button type="button" onClick={() => setConfirming(null)} disabled={busy} className={btnSmallOutline}>
            Keep request
          </button>
        </div>
      </AccountModal>
    </section>
  );
}
