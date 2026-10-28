"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageTitle from "@/components/checkout/PageTitle";
import PaymentStatusPanel, { usePaymentStatus } from "@/components/checkout/PaymentStatusPanel";
import { CheckCircle2, ArrowRight, Download, MapPin, CreditCard, ExternalLink, Check, Hash, CalendarDays, Package, Wallet, LifeBuoy } from "lucide-react";

const confirmDate = (value: string | null | undefined, withYear = true) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) })
    : "";

// Maps the API order for this page. Only stored values are used; a missing value stays empty.
function normalizeOrder(raw: any, defaultOrderId: string) {
  if (!raw) return null;

  const steps: any[] = Array.isArray(raw.stepper) ? raw.stepper : [];
  const timeline = steps.map((st: any) => ({
    title: st.label || st.key || "",
    date: st.completedAt ? confirmDate(st.completedAt, false) : st.isCompleted ? "Completed" : "Pending",
    completed: Boolean(st.isCompleted),
    current: Boolean(st.isCurrent),
  }));

  const items = (Array.isArray(raw.items) ? raw.items : []).map((it: any) => {
    const quantity = it.quantity || 1;
    const title = it.productTitle || "";
    return {
      product: {
        title,
        slug: it.productSlug || "",
        images: [it.productImage || "/images/brand/saffronvastra-mark.png"],
      },
      size: it.size || "",
      color: { name: it.colour || "" },
      quantity,
      unitPrice: it.unitPriceMinor ? it.unitPriceMinor / 100 : it.lineTotalMinor ? it.lineTotalMinor / (100 * quantity) : 0,
    };
  });

  const subtotal =
    raw.subtotalMinor != null ? raw.subtotalMinor / 100 : items.reduce((sum: number, it: any) => sum + it.unitPrice * it.quantity, 0);
  const shipping = (raw.shippingMinor || 0) / 100;
  const discount = (raw.discountMinor || 0) / 100;
  const tax = (raw.taxMinor || 0) / 100;
  const total = raw.totalMinor != null ? raw.totalMinor / 100 : subtotal + shipping - discount + tax;

  const addr = raw.shippingAddress || {};
  const shippingAddress = {
    name: addr.fullName || addr.name || "",
    street: addr.street || addr.addressLine1 || "",
    locality: addr.apartment || addr.locality || "",
    city: addr.city || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
    country: addr.country || "",
    phone: addr.phone || "",
  };

  const pm = raw.paymentMethod || {};
  const provider = String(pm.provider || pm.type || raw.payments?.[0]?.provider || "");
  const paymentMethod = {
    type: provider === "CASHFREE" ? "Online payment" : provider,
    status: raw.paymentStatus || "",
  };

  return {
    orderNumber: raw.orderNumber || defaultOrderId,
    isOnline: provider === "CASHFREE",
    date: confirmDate(raw.createdAt),
    status: raw.status || "",
    items,
    subtotal,
    shipping,
    discount,
    tax,
    total,
    shippingAddress,
    paymentMethod,
    timeline,
  };
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  // COD redirects with ?orderId=, Cashfree sends the customer back with ?order=
  const orderIdFromUrl = searchParams.get("orderId") || searchParams.get("order") || "";

  const [order, setOrder] = useState<any>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  // The order is always read from the API. A copy kept in the browser is never trusted, so this
  // page cannot show an order that is not in the customer's account.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orderIdFromUrl) {
        setLoadState("notfound");
        return;
      }
      setLoadState((prev) => (prev === "ready" ? prev : "loading"));
      try {
        const cleanId = orderIdFromUrl.replace(/^#/, "");
        const res = await fetch(`/api/v1/orders/${encodeURIComponent(cleanId)}`, { credentials: "include" });
        if (cancelled) return;
        if (res.status === 404 || res.status === 403 || res.status === 401) {
          setLoadState("notfound");
          return;
        }
        if (!res.ok) {
          setLoadState("error");
          return;
        }
        const body = await res.json();
        const serverOrder = body.data?.order || body.data;
        if (!serverOrder) {
          setLoadState("notfound");
          return;
        }
        setOrder(normalizeOrder(serverOrder, orderIdFromUrl));
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderIdFromUrl, reloadKey]);

  // An online order is only "placed" once the server says it is paid (it asks the payment provider).
  const isOnline = loadState === "ready" && Boolean(order?.isOnline);
  const pay = usePaymentStatus(order?.orderNumber || orderIdFromUrl.replace(/^#/, ""), isOnline, searchParams.get("payment") === "retry");
  const paidSeen = React.useRef(false);
  useEffect(() => {
    // the order was Pending until the payment was confirmed: read it again so the status shown is the current one
    if (isOnline && pay.view === "paid" && !paidSeen.current) {
      paidSeen.current = true;
      setReloadKey((k) => k + 1);
    }
  }, [isOnline, pay.view]);

  if (loadState !== "ready" || !order) {
    return (
      <div className="min-h-[60vh] bg-surface flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-3 max-w-md">
          {loadState === "loading" && (
            <>
              <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
              <p role="status" className="text-base text-ink-secondary">Loading your order...</p>
            </>
          )}
          {loadState === "notfound" && (
            <>
              <p role="alert" className="text-2xl font-medium text-ink">We could not find this order.</p>
              <p className="text-base text-ink-secondary">Check the link, or look for it under your orders.</p>
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center h-12 px-8 mt-2 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors"
              >
                My orders
              </Link>
            </>
          )}
          {loadState === "error" && (
            <>
              <p role="alert" className="text-2xl font-medium text-ink">We could not load this order right now.</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex items-center justify-center h-12 px-8 mt-2 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (order.isOnline && pay.view !== "paid") {
    return (
      <div className="min-h-screen bg-surface">
        <PageTitle
          title="Payment"
          crumbs={[{ label: "Homepage", href: "/" }, { label: "My Account", href: "/account" }, { label: `Order #${order.orderNumber}` }]}
        />
        <main className="max-w-[1320px] mx-auto px-4 lg:px-[15px]">
          <PaymentStatusPanel orderNumber={order.orderNumber} state={pay} />
          <p className="text-center text-base text-ink-secondary pb-16">
            Order total {inr(order.total)} &bull; {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </p>
        </main>
      </div>
    );
  }

  const itemCount = order.items.reduce((n: number, it: any) => n + it.quantity, 0);
  const isPaid = String(order.paymentMethod.status).toLowerCase() === "paid";
  const payLabel = order.isOnline ? "Paid online" : "Cash on delivery";
  const lastDone = order.timeline.reduce((acc: number, s: any, i: number) => (s.completed || s.current ? i : acc), -1);

  const card = "rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(24,24,24,0.04),0_8px_24px_-12px_rgba(24,24,24,0.08)]";
  const chip = "px-2.5 h-6 inline-flex items-center rounded-full bg-surface text-xs text-ink-secondary border border-line";

  return (
    <div className="min-h-screen bg-surface-muted">
      <main className="max-w-[1180px] mx-auto px-4 lg:px-[15px] pt-6 md:pt-10 pb-16 md:pb-24">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted mb-4 flex flex-wrap gap-1.5">
          <Link href="/" className="hover:text-ink">Homepage</Link> <span aria-hidden="true">/</span>
          <Link href="/account/orders" className="hover:text-ink">My orders</Link> <span aria-hidden="true">/</span>
          <span className="text-ink">Order #{order.orderNumber}</span>
        </nav>

        {/* Hero */}
        <section aria-labelledby="oc-title" className="relative overflow-hidden rounded-3xl bg-inverse text-on-inverse px-6 pt-9 pb-14 md:px-12 md:pt-12 md:pb-16">
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 -left-10 w-64 h-64 rounded-full bg-highlight/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-dashed border-inverse-line" aria-hidden="true" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <span className="relative w-20 h-20 shrink-0 grid place-items-center" aria-hidden="true">
              <span className="absolute inset-0 rounded-full ring-1 ring-on-inverse-muted/30" />
              <span className="absolute inset-2.5 rounded-full bg-success-bg text-success grid place-items-center">
                <CheckCircle2 className="w-9 h-9" />
              </span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm tracking-[0.18em] uppercase text-highlight font-semibold">Order confirmed</p>
              <h1 id="oc-title" className="mt-1 text-3xl md:text-[40px] leading-tight font-medium">Thank you for your order</h1>
              <p className="mt-2 text-base text-on-inverse-muted max-w-xl">
                Your made-to-order garments are now being prepared by master artisans at our Jaipur ateliers.
              </p>
            </div>
            <div className="flex flex-row md:flex-col gap-3 shrink-0">
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-on-inverse text-ink hover:bg-surface-muted text-sm font-semibold transition-colors"
              >
                Track order <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-inverse-line text-on-inverse hover:bg-inverse-hover text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> Invoice
              </button>
            </div>
          </div>
        </section>

        {/* Key facts, overlapping the hero */}
        <ul className="relative z-10 -mt-8 mx-3 md:mx-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Hash, label: "Order number", value: `#${order.orderNumber}` },
            { icon: CalendarDays, label: "Placed on", value: order.date },
            { icon: Package, label: "Items", value: `${itemCount} ${itemCount === 1 ? "piece" : "pieces"}` },
            { icon: Wallet, label: isPaid ? "Total paid" : "To pay on delivery", value: inr(order.total) },
          ].map(({ icon: Icon, label, value }) => (
            <li key={label} className={`${card} p-4 flex items-center gap-3 min-w-0`}>
              <span className="w-10 h-10 shrink-0 rounded-xl bg-surface-muted text-ink grid place-items-center" aria-hidden="true">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">{label}</p>
                <p className="text-base font-semibold text-ink truncate">{value}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Progress, steps joined by connectors */}
        {order.timeline.length > 0 && (
          <section aria-labelledby="oc-progress" className={`${card} mt-8 p-6 md:p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="oc-progress" className="text-xl font-medium text-ink">Order progress</h2>
              <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-sm font-medium bg-success-bg text-success">
                <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" /> {order.status}
              </span>
            </div>
            <ol className="mt-7 flex flex-col md:flex-row">
              {order.timeline.map((step: any, idx: number) => {
                const done = step.completed;
                const current = step.current;
                const last = idx === order.timeline.length - 1;
                const reached = idx < lastDone;
                return (
                  <li key={idx} className="relative flex md:flex-1 md:flex-col md:items-center gap-4 md:gap-0 pb-7 md:pb-0 last:pb-0" aria-current={current ? "step" : undefined}>
                    {!last && (
                      <>
                        <span aria-hidden="true" className={`md:hidden absolute left-[19px] top-10 bottom-0 ${reached ? "w-0.5 bg-ink" : "border-l-2 border-dashed border-line-strong/50"}`} />
                        <span aria-hidden="true" className={`hidden md:block absolute top-5 left-1/2 w-full ${reached ? "h-0.5 bg-ink" : "border-t-2 border-dashed border-line-strong/50"}`} />
                      </>
                    )}
                    <span
                      className={`relative z-10 w-10 h-10 shrink-0 rounded-full grid place-items-center text-sm font-semibold ${
                        done ? "bg-ink text-on-primary" : current ? "bg-surface text-ink ring-2 ring-ink" : "bg-surface-muted text-ink-muted"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" aria-hidden="true" /> : current ? <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" aria-hidden="true" /> : idx + 1}
                    </span>
                    <div className="md:mt-3 md:text-center">
                      <p className={`text-base font-medium ${done || current ? "text-ink" : "text-ink-muted"}`}>{step.title}</p>
                      <p className="text-sm text-ink-muted mt-0.5">{step.date}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start mt-6">
          {/* Items */}
          <section aria-labelledby="oc-items" className={`${card} min-w-0 p-6 md:p-8`}>
            <div className="flex items-center justify-between">
              <h2 id="oc-items" className="text-xl font-medium text-ink">Order items</h2>
              <span className="text-sm text-ink-muted">{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
            </div>
            <ul className="mt-4 space-y-3">
              {order.items.map((item: any, idx: number) => (
                <li key={idx} className="flex gap-4 items-center rounded-xl bg-surface-muted p-3">
                  <div className="relative w-20 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-surface">
                    <Image src={item.product.images[0] || "/images/brand/saffronvastra-mark.png"} alt={item.product.title} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-ink line-clamp-2">{item.product.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.size && <span className={chip}>Size {item.size}</span>}
                      {item.color?.name && <span className={chip}>{item.color.name}</span>}
                      <span className={chip}>Qty {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-semibold text-ink">{inr(item.unitPrice * item.quantity)}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{inr(item.unitPrice)} each</p>
                    {item.product.slug && (
                      <Link href={`/products/${item.product.slug}`} className="inline-flex items-center mt-1.5 min-h-8 text-sm font-semibold text-ink border-b border-ink hover:text-primary-hover hover:border-primary-hover transition-colors">
                        Buy again
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className={`${card} p-6`}>
              <h2 className="text-xl font-medium text-ink">Order summary</h2>
              <dl className="mt-4 text-base">
                <div className="flex justify-between py-2.5"><dt className="text-ink-secondary">Subtotal</dt><dd className="text-ink">{inr(order.subtotal)}</dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-ink-secondary">Shipping</dt><dd className="text-ink">{order.shipping === 0 ? "Free" : inr(order.shipping)}</dd></div>
                {order.discount > 0 && <div className="flex justify-between py-2.5"><dt className="text-ink-secondary">Discount</dt><dd className="text-success font-semibold">-{inr(order.discount)}</dd></div>}
                {order.tax > 0 && <div className="flex justify-between py-2.5"><dt className="text-ink-secondary">Tax</dt><dd className="text-ink">{inr(order.tax)}</dd></div>}
                <div className="flex justify-between items-baseline mt-2 pt-4 border-t border-dashed border-line-strong/50">
                  <dt className="text-lg font-medium text-ink">Total</dt>
                  <dd className="text-2xl font-semibold text-ink">{inr(order.total)}</dd>
                </div>
              </dl>
            </div>

            <div className={`${card} p-6`}>
              <h2 className="flex items-center gap-2.5 text-lg font-medium text-ink">
                <span className="w-9 h-9 rounded-xl bg-surface-muted grid place-items-center" aria-hidden="true"><MapPin className="w-4 h-4" /></span> Shipping address
              </h2>
              <address className="not-italic mt-3 text-base text-ink-secondary space-y-0.5">
                <p className="font-semibold text-ink">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.locality && <p>{order.shippingAddress.locality}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p className="pt-1">Phone: {order.shippingAddress.phone}</p>}
              </address>
            </div>

            <div className={`${card} p-6`}>
              <h2 className="flex items-center gap-2.5 text-lg font-medium text-ink">
                <span className="w-9 h-9 rounded-xl bg-surface-muted grid place-items-center" aria-hidden="true"><CreditCard className="w-4 h-4" /></span> Payment
              </h2>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-ink">{order.paymentMethod.type ? payLabel : "Payment method not recorded"}</p>
                <span className={`inline-flex items-center px-3 h-7 rounded-full text-sm font-medium ${isPaid ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>
                  {order.paymentMethod.status || "Unknown"}
                </span>
              </div>
              {!order.isOnline && !isPaid && <p className="mt-2 text-sm text-ink-secondary">Please keep {inr(order.total)} ready in cash when your order is delivered.</p>}
            </div>

            <div className={`${card} p-6 bg-surface-muted`}>
              <h2 className="flex items-center gap-2.5 text-lg font-medium text-ink">
                <span className="w-9 h-9 rounded-xl bg-surface grid place-items-center" aria-hidden="true"><LifeBuoy className="w-4 h-4" /></span> Need help?
              </h2>
              <p className="mt-2 text-base text-ink-secondary leading-relaxed">
                Questions about sizing adjustments or delivery? Our concierge team is here for you.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-1.5 mt-3 min-h-9 text-base font-semibold text-ink border-b border-ink hover:text-primary-hover hover:border-primary-hover transition-colors">
                Contact support
              </Link>
            </div>
          </aside>
        </div>

        <div className="text-center pt-10 md:pt-12">
          <Link href="/collections" className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors">
            Continue shopping <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center p-8 text-center space-y-3">
          <h1 className="text-3xl font-medium text-ink">Order Confirmation</h1>
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
