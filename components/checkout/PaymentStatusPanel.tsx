"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, XCircle } from "lucide-react";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { BRAND } from "@/lib/brand";

export type PayView = "checking" | "paid" | "failed" | "unpaid" | "stalled" | "cancelled" | "error";

const POLL_MS = 3000;
const WAIT_MS = 60_000;

/**
 * Asks the server (which asks the payment provider) whether an online order is paid. The browser coming back from the
 * payment page is never treated as proof. While the payment is still pending it re-checks every 3 seconds for about a minute.
 */
export function usePaymentStatus(orderNumber: string, enabled: boolean, startFailed = false) {
  // true when checkout could not open the payment page: nothing to wait for, offer the retry straight away
  const [hold, setHold] = useState(startFailed);
  const [view, setView] = useState<PayView>("checking");
  const [reason, setReason] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const retryLock = useRef(false);

  useEffect(() => {
    if (!enabled || !orderNumber) return;
    if (hold) {
      setView("unpaid");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + WAIT_MS;
    setView("checking");

    const later = () => {
      if (cancelled) return;
      if (Date.now() >= deadline) setView("stalled");
      else timer = setTimeout(check, POLL_MS);
    };

    const check = async () => {
      try {
        const res = await fetch(`/api/v1/orders/${encodeURIComponent(orderNumber)}/payment-status`, { credentials: "include", cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) return later();
        const body = (await res.json())?.data;
        if (cancelled || !body) return later();
        const pay: string = body.paymentStatus || "";
        const attempt: string | null = body.attemptStatus || null;
        if (pay === "Paid" || pay === "Partially Refunded" || pay === "Refunded") return setView("paid");
        if (body.orderStatus === "Cancelled") return setView("cancelled");
        if (pay === "Failed" || attempt === "FAILED" || attempt === "EXPIRED") {
          setReason(body.failureReason || "");
          return setView("failed");
        }
        // no payment was ever opened for this order: nothing to wait for
        if (!attempt) return setView("unpaid");
        later();
      } catch {
        later();
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderNumber, enabled, runKey, hold]);

  const checkAgain = useCallback(() => {
    setHold(false);
    setRetryError("");
    setRunKey((k) => k + 1);
  }, []);

  const retry = useCallback(async () => {
    if (retryLock.current) return;
    retryLock.current = true;
    setRetrying(true);
    setRetryError("");
    try {
      const res = await fetch(`/api/v1/orders/${encodeURIComponent(orderNumber)}/payment/start`, { method: "POST", credentials: "include" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setRetryError(body?.message || "We could not open the payment page. Your order is saved, please try again in a moment.");
        return;
      }
      if (body?.data?.alreadyPaid) {
        setHold(false);
        setRunKey((k) => k + 1);
        return;
      }
      if (!body?.data?.paymentSessionId) {
        setRetryError("We could not open the payment page. Your order is saved, please try again in a moment.");
        return;
      }
      setHold(false);
      await openCashfreeCheckout(body.data.paymentSessionId, body.data.mode === "production" ? "production" : "sandbox");
    } catch (err: any) {
      setRetryError(err?.message || "We could not open the payment page. Your order is saved, please try again in a moment.");
    } finally {
      retryLock.current = false;
      setRetrying(false);
    }
  }, [orderNumber]);

  return { view, reason, retrying, retryError, checkAgain, retry };
}

const btn =
  "inline-flex items-center justify-center min-h-12 px-8 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-on-primary text-base font-semibold transition-colors";
const btnOutline =
  "inline-flex items-center justify-center min-h-12 px-8 rounded-full border-2 border-line hover:border-ink text-ink text-base font-semibold transition-colors";

interface PanelProps {
  orderNumber: string;
  state: ReturnType<typeof usePaymentStatus>;
}

/** What the customer sees for an online order that is not (yet) paid. */
export default function PaymentStatusPanel({ orderNumber, state }: PanelProps) {
  const { view, reason, retrying, retryError, checkAgain, retry } = state;
  const retryButton = (
    <button type="button" onClick={retry} disabled={retrying} className={btn}>
      {retrying ? "Opening secure payment..." : "Try payment again"}
    </button>
  );
  const support = (
    <Link href="/contact" className="font-semibold text-ink underline hover:text-primary-hover">
      contact support
    </Link>
  );

  return (
    <div className="max-w-xl mx-auto text-center py-12 md:py-16 px-4" data-testid="payment-status-panel">
      <p className="text-sm text-ink-muted">Order #{orderNumber}</p>

      {view === "checking" && (
        <div role="status" aria-live="polite">
          <div className="w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mt-6" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-medium text-ink">Confirming your payment</h2>
          <p className="mt-2 text-base text-ink-secondary">
            Please keep this page open while we confirm your payment with the payment provider. This usually takes a few seconds.
          </p>
        </div>
      )}

      {(view === "failed" || view === "unpaid") && (
        <div role="alert">
          <XCircle className="w-10 h-10 mx-auto mt-6 text-error" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-medium text-ink">
            {view === "failed" ? "Your payment did not go through" : "Your payment is not complete"}
          </h2>
          {view === "failed" && reason && <p className="mt-2 text-base text-ink-secondary">Reason: {reason}</p>}
          <p className="mt-2 text-base text-ink-secondary">
            Your order is saved and nothing has been confirmed yet. You can try the payment again whenever you are ready.
          </p>
        </div>
      )}

      {view === "stalled" && (
        <div role="status" aria-live="polite">
          <Clock className="w-10 h-10 mx-auto mt-6 text-warning" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-medium text-ink">We are still waiting for the payment provider</h2>
          <p className="mt-2 text-base text-ink-secondary">
            We have not received a confirmation yet. Please do not pay again. If money was deducted from your account, wait for the
            payment provider&apos;s update, which can take a little while, or {support} at {BRAND.supportEmail} with your order number.
          </p>
        </div>
      )}

      {view === "cancelled" && (
        <div role="status">
          <XCircle className="w-10 h-10 mx-auto mt-6 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-medium text-ink">This order was cancelled</h2>
          <p className="mt-2 text-base text-ink-secondary">
            No further payment is needed for this order. If you were charged, the amount will be returned to your original payment
            method, or you can {support}.
          </p>
        </div>
      )}

      {view === "error" && (
        <div role="alert">
          <AlertCircle className="w-10 h-10 mx-auto mt-6 text-error" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-medium text-ink">We could not check your payment</h2>
        </div>
      )}

      {retryError && (
        <p role="alert" className="mt-4 text-sm text-error">
          {retryError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {(view === "failed" || view === "unpaid") && retryButton}
        {(view === "stalled" || view === "error") && (
          <button type="button" onClick={checkAgain} className={btn}>
            Check again
          </button>
        )}
        {view === "cancelled" && (
          <Link href="/collections" className={btn}>
            Continue shopping
          </Link>
        )}
        {view !== "checking" && view !== "cancelled" && (
          <Link href="/account/orders" className={btnOutline}>
            My orders
          </Link>
        )}
      </div>
    </div>
  );
}
