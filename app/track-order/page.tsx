"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Circle, ExternalLink, Package } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";
import { FieldError, FieldLabel, fieldClass } from "@/components/checkout/fields";
import { emailError } from "@/lib/validation";
import { useStore } from "@/context/StoreContext";

interface Tracking {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  createdAt: string;
  totalMinor: number;
  stepper: Array<{ key: string; label: string; description: string; isCompleted: boolean; isCurrent: boolean; completedAt?: string | null }>;
  items: Array<{ title: string; size: string; colour: string; quantity: number; image: string }>;
  shipment: { carrier: string; trackingNumber: string; trackingUrl: string | null; status: string; estimatedDelivery: string | null } | null;
}

const rupees = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const day = (v?: string | null) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");

/** Order lookup for someone without an account: order number plus the email address used at checkout. */
export default function TrackOrderPage() {
  const { isAuthenticated } = useStore() as any;
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ orderNumber?: string; email?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Tracking | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: typeof errors = {};
    if (!orderNumber.trim()) next.orderNumber = "Enter your order number, for example ST12345";
    const mail = emailError(email);
    if (mail) next.email = mail;
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders/track", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(null);
        setFormError(body?.message || "We could not look that up. Please try again.");
        return;
      }
      setResult(body.data as Tracking);
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const awaitingPayment = result && result.paymentProvider === "CASHFREE" && result.status === "Pending";

  return (
    <div className="bg-canvas text-ink">
      <PageTitle title="Track Your Order" crumbs={[{ label: "Home", href: "/" }, { label: "Track Order" }]} />
      <section className="py-10 md:py-16">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-[60px]">
          <div className="lg:col-span-5">
            <form onSubmit={submit} noValidate className="space-y-5" aria-describedby={formError ? "track-form-error" : undefined}>
              {isAuthenticated && (
                <p className="text-sm text-ink-secondary">
                  You are signed in. You can also see all your orders in{" "}
                  <Link href="/account/orders" className="text-ink underline underline-offset-2 hover:text-primary-hover">
                    your account
                  </Link>
                  .
                </p>
              )}
              <div>
                <FieldLabel htmlFor="track-order-number">Order number</FieldLabel>
                <input
                  id="track-order-number"
                  name="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="ST12345"
                  aria-invalid={errors.orderNumber ? true : undefined}
                  aria-describedby={errors.orderNumber ? "track-order-number-error" : undefined}
                  className={fieldClass(Boolean(errors.orderNumber))}
                />
                <FieldError id="track-order-number-error" message={errors.orderNumber} />
              </div>
              <div>
                <FieldLabel htmlFor="track-email">Email address used at checkout</FieldLabel>
                <input
                  id="track-email"
                  name="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "track-email-error" : undefined}
                  className={fieldClass(Boolean(errors.email))}
                />
                <FieldError id="track-email-error" message={errors.email} />
              </div>
              {formError && (
                <p id="track-form-error" role="alert" className="rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {loading ? "Looking up…" : "Track order"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7" aria-live="polite">
            {result ? (
              <div className="space-y-8" data-testid="track-result">
                <div>
                  <h2 className="text-2xl leading-[30px] font-medium text-ink">Order {result.orderNumber}</h2>
                  <p className="mt-1 text-sm text-ink-secondary">
                    Placed on {day(result.createdAt)} · {rupees(result.totalMinor)} ·{" "}
                    {awaitingPayment ? "Waiting for payment" : result.status === "Cancelled" ? "Cancelled" : result.status}
                  </p>
                </div>

                {result.status !== "Cancelled" && (
                  <ol className="space-y-4" aria-label="Order progress">
                    {result.stepper.map((step) => (
                      <li key={step.key} className="flex gap-3" aria-current={step.isCurrent ? "step" : undefined}>
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            step.isCompleted ? "border-ink bg-ink text-on-inverse" : step.isCurrent ? "border-ink text-ink" : "border-line-strong text-ink-muted"
                          }`}
                        >
                          {step.isCompleted ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Circle aria-hidden="true" className="h-2.5 w-2.5" />}
                        </span>
                        <div>
                          <p className={`text-base ${step.isCompleted || step.isCurrent ? "font-medium text-ink" : "text-ink-secondary"}`}>
                            {step.label}
                            <span className="sr-only">{step.isCompleted ? " (done)" : step.isCurrent ? " (current step)" : " (not yet)"}</span>
                          </p>
                          <p className="text-sm text-ink-secondary">{step.completedAt ? day(step.completedAt) : step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {awaitingPayment && (
                  <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink">
                    This order is waiting for its online payment. Sign in to your account, or open the payment link from the confirmation page, to try the payment again.
                  </p>
                )}

                {result.shipment ? (
                  <div className="rounded-2xl border border-line p-5">
                    <p className="flex items-center gap-2 text-base font-medium text-ink">
                      <Package aria-hidden="true" className="h-5 w-5" /> Shipped with {result.shipment.carrier}
                    </p>
                    <p className="mt-2 text-sm text-ink-secondary">Tracking number: {result.shipment.trackingNumber}</p>
                    {result.shipment.estimatedDelivery && <p className="text-sm text-ink-secondary">Estimated delivery: {day(result.shipment.estimatedDelivery)}</p>}
                    {result.shipment.trackingUrl && (
                      <a href={result.shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline underline-offset-2 hover:text-primary-hover">
                        Follow the shipment <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ) : null}

                <ul className="divide-y divide-line border-y border-line">
                  {result.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image} alt="" className="h-16 w-12 rounded-md bg-surface-muted object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-base text-ink">{it.title}</p>
                        <p className="text-sm text-ink-secondary">
                          {[it.size && `Size ${it.size}`, it.colour].filter(Boolean).join(" · ")} · Qty {it.quantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-muted p-6 text-sm text-ink-secondary">
                Enter your order number (you will find it in your confirmation email) and the email address you gave at checkout.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
