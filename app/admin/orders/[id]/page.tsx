"use client";

import { BRAND } from "@/lib/brand";
import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Printer,
  Mail,
  ChevronDown,
  MapPin,
  CreditCard,
  Check,
  Plus,
  Truck,
  User,
  X,
  Copy,
  RefreshCw,
} from "lucide-react";
import {
  Pill,
  RefundDialog,
  isOnlineProvider,
  paymentBadgeClass,
  providerLabel,
  readError,
  reasonLabel,
  requestBadgeClass,
  typeLabel,
  type RefundablePayment,
} from "@/components/admin/payments-shared";

interface OrderDetailProps {
  params: Promise<{ id: string }>;
}

type LoadState = "loading" | "ready" | "notfound" | "error";

// Mirrors the server rules (the server enforces them). "Shipped" is reached through Dispatch Courier.
const NEXT_STATUSES: Record<string, string[]> = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Ready to Ship", "Cancelled"],
  "Ready to Ship": ["Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const money = (minor: number | null | undefined) => `₹${((minor || 0) / 100).toLocaleString("en-IN")}`;

const when = (value: string | Date | null | undefined, withTime = true) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "";

const personName = (user: { email?: string; profile?: { displayName?: string | null } | null } | null | undefined) =>
  user?.profile?.displayName || user?.email || "Staff";

function AddressLines({ address }: { address: any }) {
  if (!address) return <p className="text-ink-muted">Not recorded</p>;
  const line2 = [address.apartment, address.addressLine2].filter(Boolean).join(", ");
  return (
    <>
      <p className="font-semibold text-ink">{address.fullName || address.name || ""}</p>
      <p>{address.street || address.addressLine1 || ""}</p>
      <p>
        {line2 ? `${line2}, ` : ""}
        {[address.city, address.pincode].filter(Boolean).join(" - ")}
      </p>
      <p>{[address.state, address.country].filter(Boolean).join(", ")}</p>
    </>
  );
}

export default function AdminOrderDetailPage({ params }: OrderDetailProps) {
  const resolvedParams = use(params);
  const cleanId = decodeURIComponent(resolvedParams.id).replace(/^#/, "").trim();

  const [order, setOrder] = useState<any>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [modalError, setModalError] = useState("");
  const [carrierInput, setCarrierInput] = useState("Bluedart");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [trackingUrlInput, setTrackingUrlInput] = useState("");
  const [estimatedDeliveryInput, setEstimatedDeliveryInput] = useState("");
  const [refundFor, setRefundFor] = useState<null | { paymentId?: string; suggestedMinor?: number }>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileNotice, setReconcileNotice] = useState("");

  // The order is read from the API. If the API has no such order the page says so.
  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${encodeURIComponent(cleanId)}`, { credentials: "include" });
      if (res.status === 404) {
        setOrder(null);
        setLoadState("notfound");
        return;
      }
      if (!res.ok) {
        setLoadState("error");
        return;
      }
      const body = await res.json();
      setOrder(body.data);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [cleanId]);

  useEffect(() => {
    setLoadState("loading");
    void loadOrder();
  }, [loadOrder]);

  // Every change is sent to the server first; the page shows the result only after the server accepted it.
  const send = async (url: string, init: RequestInit, failure: string): Promise<boolean> => {
    setBusy(true);
    setActionError("");
    setModalError("");
    try {
      const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message = body?.message || body?.errors?.[0]?.message || failure;
        setActionError(message);
        setModalError(message);
        // The order may have changed under us (another admin, a stale page); show its current state.
        await loadOrder();
        return false;
      }
      await loadOrder();
      return true;
    } catch {
      const message = "Network error: nothing was changed. Please try again.";
      setActionError(message);
      setModalError(message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: string) => {
    setStatusDropdownOpen(false);
    await send(
      `/api/v1/admin/orders/${encodeURIComponent(cleanId)}/status`,
      { method: "PATCH", body: JSON.stringify({ status: nextStatus }) },
      "The status could not be changed."
    );
  };

  // Staff record a payment only when it was really received (cash collected, transfer confirmed).
  const handlePaymentStatus = async (next: "Paid" | "Failed" | "Pending") => {
    await send(
      `/api/v1/admin/orders/${encodeURIComponent(cleanId)}/payment-status`,
      { method: "PATCH", body: JSON.stringify({ paymentStatus: next }) },
      "The payment status could not be changed."
    );
  };

  // Online payments are confirmed by the payment provider: ask it again (the webhook may have been missed).
  const handleReconcile = async () => {
    if (reconciling) return;
    setReconciling(true);
    setActionError("");
    setReconcileNotice("");
    try {
      const res = await fetch(`/api/v1/admin/orders/${encodeURIComponent(order.id)}/payments/reconcile`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        setActionError((await readError(res, "The payment status could not be checked.")).message);
      } else {
        const body = await res.json().catch(() => null);
        setReconcileNotice(`Checked with the payment provider. Payment status: ${body?.data?.paymentStatus || "unchanged"}.`);
      }
      await loadOrder();
    } catch {
      setActionError("Network error: the payment status could not be checked. Please try again.");
    } finally {
      setReconciling(false);
    }
  };

  const handleDispatchCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await send(
      `/api/v1/admin/orders/${encodeURIComponent(cleanId)}/shipments`,
      {
        method: "POST",
        body: JSON.stringify({
          carrier: carrierInput,
          trackingNumber: trackingNumberInput.trim(),
          trackingUrl: trackingUrlInput.trim() || undefined,
          estimatedDelivery: estimatedDeliveryInput || undefined,
        }),
      },
      "The shipment could not be saved."
    );
    if (ok) {
      setShowShippingModal(false);
      setTrackingNumberInput("");
      setTrackingUrlInput("");
      setEstimatedDeliveryInput("");
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) {
      setModalError("Write a note before saving");
      return;
    }
    const ok = await send(
      `/api/v1/admin/orders/${encodeURIComponent(cleanId)}/notes`,
      { method: "POST", body: JSON.stringify({ text: newNoteText.trim() }) },
      "The note could not be saved."
    );
    if (ok) {
      setNewNoteText("");
      setShowNoteModal(false);
    }
  };

  const copyBillingAddress = () => {
    const a = order?.billingAddress || order?.shippingAddress || {};
    const text = [a.fullName, a.street, a.apartment, [a.city, a.pincode].filter(Boolean).join(" - "), a.state, a.country, a.phone && `Phone: ${a.phone}`]
      .filter(Boolean)
      .join(", ");
    navigator.clipboard?.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  if (loadState !== "ready" || !order) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-3 font-sans">
        <Link href="/admin/orders" className="text-xs text-primary hover:underline">
          &larr; Back to orders
        </Link>
        {loadState === "loading" && <p role="status" className="text-sm text-ink-muted">Loading order...</p>}
        {loadState === "notfound" && (
          <p role="alert" className="text-sm text-ink">Order {resolvedParams.id} does not exist.</p>
        )}
        {loadState === "error" && (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-ink">The order could not be loaded.</p>
            <button
              type="button"
              onClick={() => {
                setLoadState("loading");
                void loadOrder();
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

  const status: string = order.status;
  const address = order.shippingAddress || {};
  const billing = order.billingAddress || order.shippingAddress || null;
  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];
  const stepper: Array<{ key: string; label: string; isCompleted: boolean; isCurrent: boolean; completedAt: string | null }> = order.stepper || [];
  const nextStatuses = NEXT_STATUSES[status] || [];
  const canDispatch = status === "Ready to Ship";
  const paymentPaid = order.paymentStatus === "Paid";
  const payments: any[] = order.payments || [];
  const provider: string = String(order.paymentMethod?.provider || payments[0]?.provider || "").toUpperCase();
  const isOnline = isOnlineProvider(provider);
  const awaitingPayment = isOnline && status === "Pending";
  const statusLabel = awaitingPayment ? "Awaiting payment" : status;
  const refundablePayments: RefundablePayment[] = payments
    .filter((p) => p.status === "SUCCESS" && p.refundableMinor > 0)
    .map((p) => ({ id: p.id, provider: p.provider, amountMinor: p.amountMinor, refundableMinor: p.refundableMinor, providerOrderId: p.providerOrderId }));
  const refundDue: number = order.refundDueMinor || 0;
  const orderRequests: any[] = order.requests || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. BREADCRUMBS & TOP ACTIONS */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link href="/admin/orders" className="hover:text-primary-hover transition-colors">
            Orders
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-muted" />
          <span className="text-ink font-medium">Order Details</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Order #{order.orderNumber}</h1>
              <span
                data-testid="order-status"
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning border border-warning-line"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span>{statusLabel}</span>
              </span>
              <span
                data-testid="payment-status"
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${
                  paymentPaid ? "bg-success-bg text-success border-success-line" : paymentBadgeClass(order.paymentStatus)
                }`}
              >
                Payment: {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Placed on <span className="text-ink font-medium">{when(order.createdAt)}</span> | Updated{" "}
              <span className="text-ink font-medium">{when(order.updatedAt)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-ink-secondary" />
              <span>Print</span>
            </button>

            {address.email ? (
              <a
                href={`mailto:${address.email}?subject=${encodeURIComponent(`Your {BRAND.name} order ${order.orderNumber}`)}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 transition-colors shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-ink-secondary" />
                <span>Email Customer</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs text-ink-muted" title="No email address was recorded for this order">
                <Mail className="w-3.5 h-3.5" />
                <span>No email on file</span>
              </span>
            )}

            <button
              onClick={() => {
                setModalError("");
                setShowShippingModal(true);
              }}
              disabled={!canDispatch || busy}
              title={canDispatch ? undefined : "Available when the order is Ready to Ship"}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-inverse-hover text-on-primary rounded-md text-xs font-semibold hover:bg-inverse transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Truck className="w-3.5 h-3.5 text-on-primary" />
              <span>Dispatch Courier</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                disabled={nextStatuses.length === 0 || busy}
                aria-haspopup="menu"
                aria-expanded={statusDropdownOpen}
                title={nextStatuses.length === 0 ? `A ${status} order cannot change status` : undefined}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Update Status</span>
                <ChevronDown className="w-3.5 h-3.5 text-on-primary" />
              </button>

              {statusDropdownOpen && nextStatuses.length > 0 && (
                <div role="menu" className="absolute right-0 mt-1 w-48 bg-surface border border-line rounded-lg shadow-xl py-1.5 z-30 text-xs">
                  {nextStatuses.map((st) => (
                    <button
                      key={st}
                      role="menuitem"
                      onClick={() => handleUpdateStatus(st)}
                      className="w-full text-left px-3.5 py-2 hover:bg-canvas text-ink"
                    >
                      Mark as {st}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between gap-3">
          <span>{actionError}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setActionError("")} className="font-bold">
            ×
          </button>
        </div>
      )}

      {copiedNotice && (
        <div className="p-3 bg-warning-bg border border-warning-line text-warning rounded-md text-xs">Billing address copied to clipboard.</div>
      )}

      {reconcileNotice && (
        <div role="status" className="p-3 bg-info-bg border border-info-line text-info rounded-md text-xs flex items-center justify-between gap-3">
          <span>{reconcileNotice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setReconcileNotice("")} className="font-bold">
            ×
          </button>
        </div>
      )}

      {refundDue > 0 && (
        <div data-testid="refund-due-banner" className="p-4 bg-warning-bg border border-warning-line text-warning rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Refund due: ₹{(refundDue / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            <p className="text-xs mt-0.5">This order was cancelled after it was paid, so the customer is owed their money back.</p>
          </div>
          {refundablePayments.length > 0 && (
            <button
              type="button"
              onClick={() => setRefundFor({ paymentId: refundablePayments[0].id, suggestedMinor: Math.min(refundDue, refundablePayments[0].refundableMinor) })}
              className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shrink-0"
            >
              Refund now
            </button>
          )}
        </div>
      )}

      {awaitingPayment && (
        <div data-testid="awaiting-payment-note" className="p-3 bg-info-bg border border-info-line text-info rounded-md text-xs">
          Awaiting payment: this online order is not confirmed until the payment provider reports a successful payment. It cannot be moved to Processing by hand.
        </div>
      )}

      {/* 2. FULFILMENT STEPPER */}
      {status === "Cancelled" ? (
        <div className="bg-surface p-6 rounded-xl border border-error-line text-sm text-error">This order was cancelled.</div>
      ) : (
        <div className="bg-surface p-6 rounded-xl border border-line shadow-2xs overflow-x-auto no-scrollbar">
          <div className="relative flex items-center justify-between min-w-[580px] max-w-4xl mx-auto px-2">
            {stepper.map((step, idx) => (
              <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                {idx < stepper.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                      stepper[idx + 1].isCompleted ? "bg-primary" : "border-t border-dashed border-line"
                    }`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    step.isCompleted && !step.isCurrent
                      ? "bg-primary text-on-primary shadow-xs"
                      : step.isCurrent
                      ? "border-2 border-primary bg-surface text-primary"
                      : "border border-line bg-canvas text-ink-muted"
                  }`}
                >
                  {step.isCompleted && !step.isCurrent ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : step.isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-line" />
                  )}
                </div>
                <div className="text-center mt-2">
                  <p className={`text-xs font-semibold ${step.isCompleted ? "text-ink" : "text-ink-muted"}`}>{step.label}</p>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      step.isCurrent ? "text-primary font-semibold uppercase tracking-wider text-[10px]" : "text-ink-muted"
                    }`}
                  >
                    {step.isCurrent ? "Current" : step.completedAt ? when(step.completedAt, false) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Customer, shipping and billing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs">
              <h3 className="text-xs font-semibold text-ink mb-3.5">Customer Information</h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border border-line bg-canvas shrink-0 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{address.fullName || "Name not recorded"}</p>
                  <p className="text-[11px] text-ink-muted truncate mt-0.5">{address.email || "No email recorded"}</p>
                  <p className="text-[11px] text-ink-muted">{address.phone || ""}</p>
                </div>
              </div>
              <p className="text-[11px] text-ink-muted mt-4 pt-3 border-t border-line">
                {order.userId ? "Registered customer" : "Guest checkout"}
              </p>
            </div>

            <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold text-ink">Shipping Address</h3>
              </div>
              <div className="text-xs text-ink-secondary space-y-0.5">
                <AddressLines address={address} />
                {address.phone && <p className="pt-1 text-ink-muted">{address.phone}</p>}
              </div>
            </div>

            <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <h3 className="text-xs font-semibold text-ink">Billing Address</h3>
                </div>
                <button type="button" onClick={copyBillingAddress} aria-label="Copy billing address" className="text-ink-muted hover:text-primary-hover">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-ink-secondary space-y-0.5">
                <AddressLines address={billing} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-line">
              <h3 className="font-serif text-lg text-ink">Order Items ({order.items.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas text-ink-muted border-b border-line font-medium">
                  <tr>
                    <th className="p-4 font-semibold text-ink">Product</th>
                    <th className="p-4 font-semibold text-ink">Variant</th>
                    <th className="p-4 font-semibold text-ink">Price</th>
                    <th className="p-4 font-semibold text-ink text-center">Qty</th>
                    <th className="p-4 font-semibold text-ink text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-md overflow-hidden relative border border-line bg-canvas shrink-0">
                            <Image src={item.productImage || "/images/brand/saffronvastra-mark.png"} alt={item.productTitle} fill unoptimized className="object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink">{item.productTitle}</p>
                            <p className="text-[11px] text-ink-muted mt-0.5">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-ink-secondary">
                        <p>Size: {item.size}</p>
                        <p className="text-ink-muted">Colour: {item.colour}</p>
                      </td>
                      <td className="p-4 font-medium text-ink">{money(item.unitPriceMinor)}</td>
                      <td className="p-4 text-center font-medium text-ink">{item.quantity}</td>
                      <td className="p-4 text-right font-semibold text-ink">{money(item.lineTotalMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments: every attempt and every refund (provider ids are shown only here) */}
          <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4" data-testid="payments-panel">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-serif text-lg text-ink">Payments</h3>
              {isOnline && (
                <button
                  type="button"
                  onClick={() => void handleReconcile()}
                  disabled={reconciling || busy}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? "animate-spin" : ""}`} />
                  <span>{reconciling ? "Checking..." : "Check payment status"}</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-ink-muted">Collected</p>
                <p className="font-semibold text-ink" data-testid="collected">{money(order.collectedMinor)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Refunded</p>
                <p className="font-semibold text-ink" data-testid="refunded">{money(order.refundedMinor)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Order total</p>
                <p className="font-semibold text-ink">{money(order.totalMinor)}</p>
              </div>
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-ink-muted">No payment attempt is recorded for this order.</p>
            ) : (
              <ul className="space-y-3">
                {payments.map((p) => (
                  <li key={p.id} className="border border-line rounded-lg p-4 text-xs space-y-3" data-testid="payment-attempt">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink">{providerLabel(p.provider)}</span>
                        <Pill className={paymentBadgeClass(p.status)}>{p.status}</Pill>
                      </div>
                      <span className="font-semibold text-ink">{money(p.amountMinor)}</span>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {p.paidAt && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Paid</dt>
                          <dd className="text-ink">{when(p.paidAt)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Attempt started</dt>
                        <dd className="text-ink">{when(p.createdAt)}</dd>
                      </div>
                      {p.providerOrderId && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Provider order id</dt>
                          <dd className="font-mono text-[11px] text-ink break-all">{p.providerOrderId}</dd>
                        </div>
                      )}
                      {p.providerPaymentId && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Provider payment id</dt>
                          <dd className="font-mono text-[11px] text-ink break-all">{p.providerPaymentId}</dd>
                        </div>
                      )}
                      {p.failureReason && (
                        <div className="flex justify-between gap-3 sm:col-span-2">
                          <dt className="text-ink-muted">Failure reason</dt>
                          <dd className="text-error text-right">{p.failureReason}</dd>
                        </div>
                      )}
                    </dl>
                    {p.status === "SUCCESS" && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-line">
                        <span className="text-ink-muted">Still refundable: {money(p.refundableMinor)}</span>
                        <button
                          type="button"
                          disabled={!(p.refundableMinor > 0)}
                          onClick={() => setRefundFor({ paymentId: p.id })}
                          className="px-3 py-1 text-xs font-semibold text-primary border border-primary rounded-xs hover:bg-primary-hover hover:text-on-primary disabled:opacity-40"
                        >
                          Refund
                        </button>
                      </div>
                    )}
                    {p.refunds?.length > 0 && (
                      <ul className="space-y-2 pt-2 border-t border-line" aria-label="Refunds for this payment">
                        {p.refunds.map((r: any) => (
                          <li key={r.id} className="bg-canvas rounded-md p-3 space-y-1" data-testid="refund-row">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink">Refund {money(r.amountMinor)}</span>
                              <Pill className={paymentBadgeClass(r.status)}>{r.status}</Pill>
                            </div>
                            <p className="text-ink-secondary">
                              {r.method === "MANUAL" ? "Recorded by staff (bank / UPI transfer)" : "Sent to the payment provider"} · {when(r.createdAt)}
                              {r.processedAt ? ` · completed ${when(r.processedAt)}` : ""}
                            </p>
                            {r.reason && <p className="text-ink-secondary">Reason: {r.reason}</p>}
                            {r.manualReference && (
                              <p className="text-ink">
                                Transfer reference: <span className="font-mono text-[11px]">{r.manualReference}</span>
                              </p>
                            )}
                            {r.refundRef && (
                              <p className="text-ink-muted">
                                Refund id: <span className="font-mono text-[11px]">{r.refundRef}</span>
                              </p>
                            )}
                            {r.initiatedByUserId && <p className="text-ink-muted">By {r.initiatedByName || "a staff member"}</p>}
                            {r.status === "PENDING" && r.method !== "MANUAL" && (
                              <p className="text-warning">Waiting for the payment provider to confirm. Use Check payment status to ask again.</p>
                            )}
                            {r.failureReason && <p className="text-error">Failed: {r.failureReason}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Requests raised for this order */}
          <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-3" data-testid="order-requests">
            <h3 className="font-serif text-lg text-ink">Cancellation, return &amp; exchange requests</h3>
            {orderRequests.length === 0 ? (
              <p className="text-xs text-ink-muted">No requests have been raised for this order.</p>
            ) : (
              <ul className="divide-y divide-line">
                {orderRequests.map((r) => (
                  <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div>
                      <Link href={`/admin/returns/${r.id}`} className="font-semibold text-primary hover:underline">
                        {r.requestNumber}
                      </Link>
                      <span className="text-ink-secondary">
                        {" "}
                        · {typeLabel(r.type)} · {reasonLabel(r.reasonCode)}
                      </span>
                    </div>
                    <Pill className={requestBadgeClass(r.status)}>{r.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Timeline: the recorded status changes, newest last */}
          <div className="bg-surface p-6 rounded-xl border border-line shadow-2xs">
            <h3 className="font-serif text-lg text-ink mb-6">Order Timeline</h3>
            {order.statusHistory.length === 0 ? (
              <p className="text-xs text-ink-muted">No status changes have been recorded yet.</p>
            ) : (
              <ol className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-line">
                {order.statusHistory.map((h: any) => (
                  <li key={h.id} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center ring-4 ring-surface">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <p className="text-xs font-semibold text-ink">{h.newStatus}</p>
                        <p className="text-[11px] text-ink-muted">{when(h.createdAt)}</p>
                      </div>
                      {h.note && <p className="text-xs text-ink-muted mt-0.5">{h.note}</p>}
                      <p className="text-[11px] text-ink-muted mt-0.5">{h.actorUser ? `By ${personName(h.actorUser)}` : "System"}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4">
            <h3 className="font-serif text-lg text-ink">Order Summary</h3>
            <div className="space-y-2.5 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Items Total</span>
                <span className="font-medium text-ink">{money(order.subtotalMinor)}</span>
              </div>
              {order.discountMinor > 0 && (
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-medium text-ink">-{money(order.discountMinor)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="font-medium text-ink">{money(order.shippingMinor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span className="font-medium text-ink">{money(order.taxMinor)}</span>
              </div>
              <div className="pt-3 border-t border-line flex items-center justify-between text-sm font-serif">
                <span className="font-semibold text-ink">Total</span>
                <span className="text-lg font-bold text-ink">{money(order.totalMinor)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4">
            <h3 className="font-serif text-base text-ink">Payment Details</h3>
            {isOnline && (
              <p data-testid="provider-confirmed" className="p-2.5 bg-info-bg border border-info-line text-info rounded-md text-xs">
                Confirmed by the payment provider. Online payments cannot be marked paid or failed by hand; use Check payment status in the Payments panel.
              </p>
            )}
            {!isOnline && (order.paymentStatus === "Pending" || order.paymentStatus === "Failed") && (
              <div className="flex items-center gap-2" data-testid="payment-actions">
                <button
                  type="button"
                  disabled={busy || order.status === "Cancelled"}
                  onClick={() => handlePaymentStatus("Paid")}
                  className="px-2.5 py-1 text-xs font-semibold text-on-primary bg-inverse-hover rounded-xs hover:bg-inverse disabled:opacity-40"
                >
                  Mark as paid
                </button>
                {order.paymentStatus === "Pending" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handlePaymentStatus("Failed")}
                    className="px-2.5 py-1 text-xs font-semibold text-primary border border-primary rounded-xs hover:bg-primary-hover hover:text-on-primary disabled:opacity-40"
                  >
                    Mark as failed
                  </button>
                )}
              </div>
            )}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Payment Status</span>
                <span className="font-medium text-ink">{order.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Payment Method</span>
                <span className="font-medium text-ink">{providerLabel(payment?.provider || order.paymentMethod?.provider)}</span>
              </div>
              {payment?.providerReference && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-muted">Reference</span>
                  <span className="font-mono text-[11px] text-ink truncate">{payment.providerReference}</span>
                </div>
              )}
              {payment && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Recorded</span>
                  <span className="text-ink">{when(payment.createdAt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Amount</span>
                <span className="font-semibold text-ink">{money(order.totalMinor)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4">
            <h3 className="font-serif text-base text-ink">Shipping Details</h3>
            {shipment ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Courier Partner</span>
                  <span className="font-medium text-ink">{shipment.carrier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Tracking Number</span>
                  <span className="font-mono text-[11px] text-ink">{shipment.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Shipment Date</span>
                  <span className="text-ink">{when(shipment.shippedAt, false)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Expected Delivery</span>
                  <span className="text-ink">{when(shipment.estimatedDelivery, false)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Current Status</span>
                  <span className="text-ink">{shipment.status}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">No shipment yet. Dispatch the courier when the order is Ready to Ship.</p>
            )}
          </div>

          <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base text-ink">Internal Notes</h3>
              <button
                onClick={() => {
                  setModalError("");
                  setShowNoteModal(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary border border-primary rounded-xs hover:bg-primary-hover hover:text-on-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Note</span>
              </button>
            </div>
            <p className="text-[11px] text-ink-muted">Only staff can see these notes.</p>
            <div className="space-y-3">
              {order.notes.length === 0 && <p className="text-xs text-ink-muted">No notes yet.</p>}
              {order.notes.map((note: any) => (
                <div key={note.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-ink">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{personName(note.author)}</span>
                    </div>
                    <span className="text-[11px] text-ink-muted">{when(note.createdAt)}</span>
                  </div>
                  <div className="p-3 bg-surface-muted/80 border border-line rounded-md text-xs text-ink leading-relaxed whitespace-pre-wrap">
                    {note.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {refundFor && (
        <RefundDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          payments={refundablePayments}
          defaultPaymentId={refundFor.paymentId}
          suggestedMinor={refundFor.suggestedMinor}
          onClose={() => setRefundFor(null)}
          onChanged={() => void loadOrder()}
        />
      )}

      {/* MODAL: ADD NOTE */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Add internal order note">
          <div className="fixed inset-0 bg-ink/50" onClick={() => setShowNoteModal(false)} />
          <div className="relative bg-surface rounded-xl border border-line shadow-2xl max-w-md w-full p-6 space-y-4 z-10">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-lg text-ink">Add Internal Order Note</h3>
              <button onClick={() => setShowNoteModal(false)} aria-label="Close">
                <X className="w-4 h-4 text-ink-muted" />
              </button>
            </div>
            <textarea
              rows={4}
              maxLength={1000}
              aria-label="Note"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="e.g. Fabric dispatched to the embroidery master."
              className="w-full p-3 border border-line rounded-md text-xs bg-canvas focus:outline-none focus:border-primary"
            />
            {modalError && (
              <p role="alert" className="text-xs text-error">
                {modalError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setShowNoteModal(false)} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={busy}
                className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH COURIER */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Dispatch courier">
          <div className="fixed inset-0 bg-ink/50" onClick={() => setShowShippingModal(false)} />
          <form onSubmit={handleDispatchCourier} className="relative bg-surface rounded-xl border border-line shadow-2xl max-w-md w-full p-6 space-y-4 z-10">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-lg text-ink">Dispatch Courier</h3>
              <button type="button" onClick={() => setShowShippingModal(false)} aria-label="Close">
                <X className="w-4 h-4 text-ink-muted" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-semibold block mb-1">Courier Partner</span>
                <select value={carrierInput} onChange={(e) => setCarrierInput(e.target.value)} className="w-full p-2 border border-line rounded-md bg-canvas">
                  <option value="Bluedart">Bluedart</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="DTDC">DTDC</option>
                  <option value="DHL Express">DHL Express</option>
                </select>
              </label>
              <label className="block">
                <span className="font-semibold block mb-1">Air Waybill / Tracking Number</span>
                <input
                  type="text"
                  name="trackingNumber"
                  required
                  minLength={3}
                  maxLength={100}
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full p-2 border border-line rounded-md bg-canvas"
                />
              </label>
              <label className="block">
                <span className="font-semibold block mb-1">Tracking Link (optional)</span>
                <input
                  type="url"
                  name="trackingUrl"
                  value={trackingUrlInput}
                  onChange={(e) => setTrackingUrlInput(e.target.value)}
                  placeholder="https://"
                  className="w-full p-2 border border-line rounded-md bg-canvas"
                />
              </label>
              <label className="block">
                <span className="font-semibold block mb-1">Expected Delivery Date (optional)</span>
                <input
                  type="date"
                  name="estimatedDelivery"
                  value={estimatedDeliveryInput}
                  onChange={(e) => setEstimatedDeliveryInput(e.target.value)}
                  className="w-full p-2 border border-line rounded-md bg-canvas"
                />
              </label>
            </div>
            {modalError && (
              <p role="alert" className="text-xs text-error">
                {modalError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowShippingModal(false)} className="px-3.5 py-1.5 border border-line rounded-md text-xs font-semibold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Dispatch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
