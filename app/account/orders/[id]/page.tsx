"use client";

import { BRAND_NAME_UPPER } from "@/lib/brand";
import React, { useState, useEffect, useRef, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import { useStore } from "@/context/StoreContext";
import {
  Download,
  Truck,
  Headphones,
  ExternalLink,
  Printer,
  X,
  ShoppingBag,
  Heart,
  CheckCircle,
} from "lucide-react";
import AccountShell from "@/components/account/AccountShell";
import AccountModal from "@/components/account/AccountModal";
import PaymentCard from "@/components/orders/PaymentCard";
import RequestDialog from "@/components/orders/RequestDialog";
import RequestTimeline from "@/components/orders/RequestTimeline";
import { OrderPayment, OrderRequestData, isOpenRequest, providerLabel } from "@/components/orders/shared";
import { StatusBadge } from "@/components/account/OrdersTable";
import {
  btnPrimary,
  btnSmall,
  btnSmallOutline,
  inputClass,
  labelClass,
  sectionTitle,
  textareaClass,
} from "@/components/auth/ui";

interface OrderItemDetail {
  id: string;
  slug: string;
  title: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface MilestoneStep {
  title: string;
  timestamp: string;
  subtitle?: string;
}

interface ShipmentDetail {
  id: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: string;
  shippedAt: string;
  estimatedDelivery: string;
  deliveredAt: string;
}

type LoadState = "loading" | "ready" | "notfound" | "signin" | "error";

interface OrderDetailData {
  orderNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  shipments: ShipmentDetail[];
  totalItems: number;
  items: OrderItemDetail[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  recipient: {
    name: string;
    street: string;
    cityStateZip: string;
    country: string;
    phone: string;
  };
  payment: {
    type: string;
    gateway: string;
  };
  provider: string;
  totalMinor: number;
  collectedMinor: number;
  refundedMinor: number;
  refundDueMinor: number;
  payments: OrderPayment[];
  requests: OrderRequestData[];
  stepper: {
    currentStep: number; // 1 to 5
    steps: MilestoneStep[];
  };
}

const formatDate = (value: string | Date | null | undefined, withYear = true) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) })
    : "";

// Maps the API order to what the page shows. Only stored values are used; a missing value stays empty.
function mapOrder(o: any, fallbackNumber: string): OrderDetailData {
  const items: OrderItemDetail[] = (o.items || []).map((it: any, idx: number) => ({
    id: it.id || `item-${idx}`,
    slug: it.productSlug || "",
    title: it.productTitle || "",
    image: it.productImage || "/images/brand/saffronvastra-mark.png",
    size: it.size || "",
    color: it.colour || "",
    quantity: it.quantity || 1,
    price: (it.unitPriceMinor || 0) / 100,
  }));

  const addr = o.shippingAddress || {};
  const subtotal = typeof o.subtotalMinor === "number" ? o.subtotalMinor / 100 : items.reduce((a, c) => a + c.price * c.quantity, 0);
  const discount = (o.discountMinor || 0) / 100;
  const shipping = (o.shippingMinor || 0) / 100;
  const tax = (o.taxMinor || 0) / 100;
  const total = typeof o.totalMinor === "number" ? o.totalMinor / 100 : subtotal - discount + shipping + tax;

  const backendSteps: any[] = Array.isArray(o.stepper) ? o.stepper : [];
  const currentIndex = backendSteps.findIndex((s) => s.isCurrent);
  const lastDone = backendSteps.reduce((acc, s, i) => (s.isCompleted ? i : acc), -1);
  const steps: MilestoneStep[] = backendSteps.map((s) => ({
    title: s.label || s.key,
    timestamp:
      s.completedAt || s.timestamp ? formatDate(s.completedAt || s.timestamp, false) : s.isCompleted ? "Completed" : "Pending",
  }));

  const provider = o.paymentMethod?.provider || o.payments?.[0]?.provider || "";
  const cityLine = [addr.city, addr.state].filter(Boolean).join(", ");

  return {
    orderNumber: o.orderNumber || fallbackNumber,
    date: formatDate(o.createdAt),
    status: o.status || "",
    paymentStatus: o.paymentStatus || "",
    totalItems: items.reduce((sum, it) => sum + it.quantity, 0),
    items,
    subtotal,
    shipping,
    discount,
    tax,
    total,
    recipient: {
      name: addr.fullName || addr.name || "",
      street: [addr.street || addr.addressLine1, addr.apartment].filter(Boolean).join(", "),
      cityStateZip: [cityLine, addr.pincode].filter(Boolean).join(" "),
      country: addr.country || "",
      phone: addr.phone || "",
    },
    payment: { type: provider, gateway: provider ? `Payment method: ${provider}` : "Payment method not recorded" },
    provider,
    totalMinor: typeof o.totalMinor === "number" ? o.totalMinor : Math.round(total * 100),
    collectedMinor: o.collectedMinor || 0,
    refundedMinor: o.refundedMinor || 0,
    refundDueMinor: o.refundDueMinor || 0,
    payments: Array.isArray(o.payments) ? o.payments : [],
    requests: Array.isArray(o.requests) ? o.requests : [],
    shipments: (o.shipments || []).map((sh: any) => ({
      id: sh.id,
      carrier: sh.carrier,
      trackingNumber: sh.trackingNumber,
      trackingUrl: sh.trackingUrl || "",
      status: sh.status || "",
      shippedAt: formatDate(sh.shippedAt),
      estimatedDelivery: formatDate(sh.estimatedDelivery),
      deliveredAt: formatDate(sh.deliveredAt),
    })),
    stepper: {
      currentStep: currentIndex >= 0 ? currentIndex + 1 : Math.max(lastDone + 1, 1),
      steps,
    },
  };
}

export default function OrderDetailPage({ params }: { params?: Promise<{ id: string }> }) {
  const unwrappedParams = params ? use(params) : null;
  const routeParams = useParams();
  const rawId = unwrappedParams?.id || (routeParams?.id as string) || "";
  const orderId = rawId.toUpperCase();

  const { addToCart, openCart, toggleWishlist, isInWishlist, user } = useStore();

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [buyAgainMessage, setBuyAgainMessage] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [buyAgainLoading, setBuyAgainLoading] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportReason, setSupportReason] = useState("Delivery assistance or update");
  const [supportError, setSupportError] = useState("");
  const [supportSending, setSupportSending] = useState(false);

  // The request goes to the concierge inbox; the confirmation shows only once it is saved.
  const sendSupportRequest = async () => {
    if (!order || supportSending) return;
    setSupportSending(true);
    setSupportError("");
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: user?.fullName || order.recipient.name,
          email: user?.email || "",
          phone: user?.phone || undefined,
          orderNumber: order.orderNumber,
          subject: supportReason,
          message: supportMessage,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSupportError(body?.message || "We could not send your request. Please try again.");
        return;
      }
      setSupportSubmitted(true);
      setSupportMessage("");
    } catch {
      setSupportError("Network error: your request was not sent. Please try again.");
    } finally {
      setSupportSending(false);
    }
  };
  const [requestDialog, setRequestDialog] = useState<"cancel" | "return" | null>(null);
  const lastDialog = useRef<"cancel" | "return">("cancel");
  const refreshOrder = useCallback(() => setReloadKey((k) => k + 1), []);
  const [detailTab, setDetailTab] = useState<"history" | "items" | "courier" | "receiver">("history");

  // Load the order from the API. Nothing on this page is invented: when the API has no such order
  // for this customer, the page says so instead of showing a stand-in order.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // A refresh after a payment or request change keeps the page (and any open dialog) in place.
      if (reloadKey === 0 || !order) setLoadState("loading");
      try {
        const res = await fetch(`/api/v1/me/orders/${encodeURIComponent(orderId)}`, { credentials: "include" });
        if (cancelled) return;
        if (res.status === 404 || res.status === 403) {
          setOrder(null);
          setLoadState("notfound");
          return;
        }
        if (res.status === 401) {
          setLoadState("signin");
          return;
        }
        if (!res.ok) {
          setLoadState("error");
          return;
        }
        const body = await res.json();
        if (!body?.data) {
          setLoadState("notfound");
          return;
        }
        setOrder(mapOrder(body.data, orderId));
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, reloadKey]);

  // "You may also like" comes from the live catalogue (published products only).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/products?limit=12&sort=featured")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !Array.isArray(body?.items)) return;
        setCatalogue(body.items.map(mapBackendProductToFrontend));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const recommendations = catalogue
    .filter((p) => !order?.items.some((i) => i.slug === p.slug))
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      image: p.images[0],
      rawProduct: p,
    }));

  // Buy again adds the product as it is in the catalogue today (current price and availability).
  const handleBuyAgain = async (item: OrderItemDetail) => {
    setBuyAgainLoading(item.id);
    setBuyAgainMessage("");
    try {
      const res = await fetch(`/api/v1/products/${encodeURIComponent(item.slug)}`, { credentials: "include" });
      if (!res.ok) {
        setBuyAgainMessage(`"${item.title}" is no longer available.`);
        return;
      }
      const product = mapBackendProductToFrontend((await res.json()).data);
      const color = product.colors.find((c) => c.name.toLowerCase() === item.color.toLowerCase()) || product.colors[0];
      const size = (product.sizes as string[]).includes(item.size) ? item.size : product.sizes[0];
      addToCart(product, size as any, color, 1);
      openCart();
    } catch {
      setBuyAgainMessage("Could not add this item right now. Please try again.");
    } finally {
      setBuyAgainLoading(null);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "My Account", href: "/account" },
    { label: "Orders", href: "/account/orders" },
    { label: order ? `Order #${order.orderNumber}` : "Order Details" },
  ];

  if (loadState !== "ready" || !order) {
    return (
      <AccountShell title="Order Details" crumbs={crumbs} active="orders">
        <div className="rounded-2xl border border-line p-8 sm:p-10 text-center space-y-4">
          {loadState === "loading" && (
            <>
              <div className="w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
              <p role="status" className="text-base text-ink-secondary">Retrieving your order...</p>
            </>
          )}
          {loadState === "notfound" && (
            <>
              <p role="alert" className="text-base text-ink-secondary">
                We could not find order {orderId} in your account.
              </p>
              <Link href="/account/orders" className={btnSmall}>
                View all my orders
              </Link>
            </>
          )}
          {loadState === "signin" && (
            <>
              <p role="alert" className="text-base text-ink-secondary">Your session has expired. Please sign in again.</p>
              <Link href={`/auth/login?redirect=${encodeURIComponent(`/account/orders/${orderId}`)}`} className={btnSmall}>
                Sign in
              </Link>
            </>
          )}
          {loadState === "error" && (
            <>
              <p role="alert" className="text-base text-ink-secondary">We could not load this order right now.</p>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={btnSmall}>
                Try again
              </button>
            </>
          )}
        </div>
      </AccountShell>
    );
  }

  const firstItem = order.items[0];
  const TABS = [
    { id: "history", label: "Order History" },
    { id: "items", label: "Item Details" },
    { id: "courier", label: "Courier" },
    { id: "receiver", label: "Receiver" },
  ] as const;

  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (idx + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setDetailTab(TABS[next].id);
    document.getElementById(`order-tab-${TABS[next].id}`)?.focus();
  };

  const waitingForPayment = order.provider === "CASHFREE" && order.status === "Pending" && order.paymentStatus !== "Paid";
  const openCancel = order.requests.some((r) => r.type === "CANCELLATION" && isOpenRequest(r));
  const canAskCancel = ["Pending", "Processing", "Ready to Ship"].includes(order.status) && !openCancel;
  const canAskReturn = order.status === "Delivered";
  const itemLookup = Object.fromEntries(order.items.map((i) => [i.id, { title: i.title, size: i.size }]));
  const paymentText =
    order.provider === "CASHFREE" && order.paymentStatus === "Pending"
      ? order.status === "Cancelled"
        ? "Not paid"
        : "Waiting for payment"
      : order.provider !== "CASHFREE" && order.paymentStatus === "Pending"
      ? "To be paid on delivery"
      : order.paymentStatus || "Unknown";

  const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <AccountShell title="Order Details" crumbs={crumbs} active="orders">
      <div className="space-y-12">
        {/* ORDER CARD */}
        <div className="rounded-2xl border border-line p-4 sm:p-6">
          {/* Header: first piece, status and number */}
          <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-dashed border-line">
            {firstItem && (
              <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-muted">
                <Image src={firstItem.image} alt="" fill sizes="80px" className="object-cover object-top" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <StatusBadge status={waitingForPayment ? (order.paymentStatus === "Failed" ? "Payment failed" : "Waiting for payment") : order.status} />
              <h2 className="mt-1.5 font-heading text-xl sm:text-2xl font-medium text-ink break-words">Order #{order.orderNumber}</h2>
              <p className="mt-0.5 text-sm text-ink-secondary">
                Placed on {order.date} &bull; {order.totalItems} {order.totalItems === 1 ? "Item" : "Items"}
              </p>
            </div>
          </div>

          {/* Key facts */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 py-6">
            <div>
              <dt className="text-base text-ink-secondary">Item</dt>
              <dd className="mt-1 text-base font-semibold text-ink">
                {firstItem?.title || "Not recorded"}
                {order.items.length > 1 && (
                  <span className="font-normal text-ink-secondary"> and {order.items.length - 1} more</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-base text-ink-secondary">Order Total</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{money(order.total)}</dd>
            </div>
            <div>
              <dt className="text-base text-ink-secondary">Placed On</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{order.date || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="text-base text-ink-secondary">Payment</dt>
              <dd className="mt-1 text-base font-semibold text-ink">
                {order.provider ? providerLabel(order.provider) : "Payment method not recorded"}
                <span className="font-normal text-ink-secondary"> &bull; {paymentText}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-base text-ink-secondary">Address</dt>
              <dd className="mt-1 text-base font-semibold text-ink">
                {[order.recipient.street, order.recipient.cityStateZip].filter(Boolean).join(", ") || "Not recorded"}
              </dd>
            </div>
          </dl>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pb-6">
            <button type="button" onClick={() => setShowTrackingModal(true)} className={btnSmall}>
              <Truck className="w-4 h-4" aria-hidden="true" />
              Track Shipment
            </button>
            <button type="button" onClick={() => setShowInvoiceModal(true)} className={btnSmallOutline}>
              <Download className="w-4 h-4" aria-hidden="true" />
              Download Invoice
            </button>
            <button type="button" onClick={() => setShowSupportModal(true)} className={btnSmallOutline}>
              <Headphones className="w-4 h-4" aria-hidden="true" />
              Contact Support
            </button>
            {canAskCancel && (
              <button
                type="button"
                onClick={() => {
                  lastDialog.current = "cancel";
                  setRequestDialog("cancel");
                }}
                className={btnSmallOutline}
              >
                Cancel order
              </button>
            )}
            {canAskReturn && (
              <button
                type="button"
                onClick={() => {
                  lastDialog.current = "return";
                  setRequestDialog("return");
                }}
                className={btnSmallOutline}
              >
                Return or exchange
              </button>
            )}
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Order information" className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-none border-b border-line">
            {TABS.map((tab, idx) => {
              const selected = detailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`order-tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`order-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setDetailTab(tab.id)}
                  onKeyDown={(e) => onTabKey(e, idx)}
                  className={`relative shrink-0 min-h-[44px] pb-2 text-base whitespace-nowrap transition-colors ${
                    selected ? "text-secondary" : "text-ink hover:text-primary-hover"
                  }`}
                >
                  {tab.label}
                  {selected && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-secondary" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`order-panel-${detailTab}`}
            aria-labelledby={`order-tab-${detailTab}`}
            tabIndex={0}
            className="pt-6 outline-none"
          >
            {detailTab === "history" &&
              (order.stepper.steps.length === 0 ? (
                <p className="text-base text-ink-secondary">No progress has been recorded for this order yet.</p>
              ) : (
                <ol className="relative">
                  {order.stepper.steps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum <= order.stepper.currentStep;
                    const isCurrent = stepNum === order.stepper.currentStep;
                    const isLast = idx === order.stepper.steps.length - 1;
                    return (
                      <li key={`${step.title}-${idx}`} className="relative flex gap-4 pb-8 last:pb-0">
                        {!isLast && (
                          <span aria-hidden="true" className="absolute left-[10px] top-6 bottom-0 border-l border-dashed border-line-strong" />
                        )}
                        <span
                          aria-hidden="true"
                          className={`relative z-10 mt-0.5 w-[21px] h-[21px] shrink-0 rounded-full border-2 flex items-center justify-center bg-surface ${
                            isCompleted ? "border-success" : "border-line-strong"
                          }`}
                        >
                          <span className={`w-[9px] h-[9px] rounded-full ${isCompleted ? "bg-success" : "bg-line-strong"}`} />
                        </span>
                        <div>
                          <p className="text-base font-semibold text-ink">
                            {step.title}
                            {isCurrent && <span className="sr-only"> (current step)</span>}
                          </p>
                          <p className="text-base text-ink-secondary">{step.timestamp}</p>
                          {step.subtitle && <p className="text-sm text-ink-muted">{step.subtitle}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ))}

            {detailTab === "items" && (
              <div className="space-y-6">
                <ul className="divide-y divide-line">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative w-[72px] h-[90px] shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                          <Image src={item.image} alt="" fill sizes="72px" className="object-cover object-top" />
                        </div>
                        <div className="min-w-0">
                          {item.slug ? (
                            <Link href={`/products/${item.slug}`} className="text-base font-medium text-ink hover:text-primary-hover line-clamp-2">
                              {item.title}
                            </Link>
                          ) : (
                            <p className="text-base font-medium text-ink line-clamp-2">{item.title}</p>
                          )}
                          <p className="mt-0.5 text-sm text-ink-secondary">
                            {[item.size && `Size: ${item.size}`, item.color && `Colour: ${item.color}`, `Qty: ${item.quantity}`]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                          <p className="mt-1 text-base font-semibold text-ink">{money(item.price)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuyAgain(item)}
                        disabled={buyAgainLoading === item.id || !item.slug}
                        className={`${btnSmallOutline} self-start sm:self-center`}
                      >
                        {buyAgainLoading === item.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                            Buy Again
                          </>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl bg-surface-muted p-5 space-y-3 text-base text-ink-secondary">
                  <h3 className="font-heading text-lg font-medium text-ink">Order Summary</h3>
                  <div className="flex items-center justify-between gap-4">
                    <span>
                      Subtotal ({order.totalItems} {order.totalItems === 1 ? "item" : "items"})
                    </span>
                    <span className="font-medium text-ink">{money(order.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Shipping</span>
                    <span className="font-medium text-ink">{order.shipping > 0 ? money(order.shipping) : "Free"}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-success">
                      <span>Discount</span>
                      <span className="font-medium">- {money(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span>Tax (GST Included)</span>
                    <span className="font-medium text-ink">{money(order.tax)}</span>
                  </div>
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-4">
                    <span className="font-semibold text-ink">Total</span>
                    <span className="font-heading text-xl font-semibold text-ink">{money(order.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {detailTab === "courier" &&
              (order.shipments.length === 0 ? (
                <p className="text-base text-ink-secondary">
                  No shipment yet. Courier and tracking details appear here once the order is dispatched.
                </p>
              ) : (
                <ul className="space-y-4">
                  {order.shipments.map((sh) => (
                    <li key={sh.id} className="rounded-xl border border-line p-4 space-y-1 text-base">
                      <p className="font-semibold text-ink">
                        {sh.carrier} &bull; <span className="font-mono">{sh.trackingNumber}</span>
                      </p>
                      {sh.status && <p className="text-ink-secondary">Status: {sh.status}</p>}
                      {sh.shippedAt && <p className="text-ink-secondary">Shipped: {sh.shippedAt}</p>}
                      {sh.deliveredAt ? (
                        <p className="text-ink-secondary">Delivered: {sh.deliveredAt}</p>
                      ) : (
                        sh.estimatedDelivery && <p className="text-ink-secondary">Estimated delivery: {sh.estimatedDelivery}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ))}

            {detailTab === "receiver" && (
              <div className="space-y-4">
                <div className="text-base text-ink leading-relaxed">
                  <p className="font-semibold">{order.recipient.name || "Not recorded"}</p>
                  {order.recipient.street && <p>{order.recipient.street}</p>}
                  {order.recipient.cityStateZip && <p>{order.recipient.cityStateZip}</p>}
                  {order.recipient.country && <p>{order.recipient.country}</p>}
                  {order.recipient.phone && <p className="text-ink-secondary">Phone: {order.recipient.phone}</p>}
                </div>
                <p className="text-sm text-ink-secondary">
                  Need a different delivery address? Address changes are handled by our customer support team.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PAYMENT */}
        <PaymentCard
          orderNumber={order.orderNumber}
          orderStatus={order.status}
          paymentStatus={order.paymentStatus}
          provider={order.provider}
          totalMinor={order.totalMinor}
          collectedMinor={order.collectedMinor}
          refundedMinor={order.refundedMinor}
          refundDueMinor={order.refundDueMinor}
          payments={order.payments}
          onChanged={refreshOrder}
        />

        {/* REQUESTS */}
        {order.requests.length > 0 ? (
          <RequestTimeline orderNumber={order.orderNumber} requests={order.requests} items={itemLookup} onChanged={refreshOrder} />
        ) : (
          (canAskCancel || canAskReturn) && (
            <p className="text-base text-ink-secondary" data-testid="no-requests">
              You have not sent any cancellation, return or exchange requests for this order.
            </p>
          )
        )}

        {/* YOU MAY ALSO LIKE (live catalogue) */}
        {recommendations.length > 0 && (
          <section aria-labelledby="order-recs-title">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 id="order-recs-title" className={sectionTitle}>
                You May Also Like
              </h2>
              <Link href="/collections" className="text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
                View All
              </Link>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
              {recommendations.map((item) => {
                const isFav = isInWishlist(item.rawProduct.id);
                return (
                  <li key={item.id} className="group">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-muted">
                      <Link href={`/products/${item.slug}`} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 50vw, 170px"
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.rawProduct.id)}
                        aria-label={isFav ? `Remove ${item.title} from wishlist` : `Add ${item.title} to wishlist`}
                        aria-pressed={isFav}
                        className="absolute top-2 right-2 w-11 h-11 rounded-full bg-surface text-ink shadow-card flex items-center justify-center hover:text-primary-hover transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? "fill-current text-secondary" : ""}`} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(item.rawProduct, item.rawProduct.sizes[0], item.rawProduct.colors[0], 1);
                          openCart();
                        }}
                        aria-label={`Add ${item.title} to bag`}
                        className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-surface text-ink shadow-card flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <Link href={`/products/${item.slug}`} className="mt-3 block text-base text-ink hover:text-primary-hover line-clamp-1">
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-base font-semibold text-ink">{money(item.price)}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* MODAL 1: PRINTABLE TAX INVOICE */}
      <AccountModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Invoice" size="lg">
        <div className="border-b border-line pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="font-heading text-xl font-semibold tracking-wide text-ink">{BRAND_NAME_UPPER}</p>
              <p className="text-xs text-ink-muted tracking-widest uppercase mt-0.5">Handcrafted Clothing &amp; Traditional Embroidery</p>
              <p className="text-sm text-ink-muted mt-2">Plot 42, Hawa Mahal Heritage Enclave, Jaipur, Rajasthan 302002</p>
              <p className="text-sm text-ink-muted font-mono">GSTIN: 08AAECS9281M1ZK</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded bg-surface-muted text-ink text-xs font-bold uppercase tracking-wider">Tax Invoice</span>
              <p className="font-mono text-sm text-ink mt-2">Invoice: INV-{order.orderNumber}-2026</p>
              <p className="text-sm text-ink-muted">Date: {order.date}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-line text-sm">
          <div>
            <p className="font-bold text-ink uppercase tracking-wider text-xs">Billed To:</p>
            <p className="font-semibold text-ink mt-1">{order.recipient.name}</p>
            <p className="text-ink-secondary">{order.recipient.street}</p>
            <p className="text-ink-secondary">{order.recipient.cityStateZip}</p>
            <p className="text-ink-secondary">{order.recipient.country}</p>
            <p className="text-ink-muted mt-1">Phone: {order.recipient.phone}</p>
          </div>
          <div>
            <p className="font-bold text-ink uppercase tracking-wider text-xs">Payment Summary:</p>
            <p className="text-ink-secondary mt-1">Method: {order.payment.type || "Not recorded"}</p>
            <p className="text-ink-secondary">Status: {order.paymentStatus || "Unknown"}</p>
          </div>
        </div>

        <div className="py-6 border-b border-line">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm text-left">
              <thead>
                <tr className="border-b border-line text-ink-muted uppercase tracking-wider text-xs">
                  <th scope="col" className="pb-2">Description</th>
                  <th scope="col" className="pb-2 text-center">HSN</th>
                  <th scope="col" className="pb-2 text-center">Qty</th>
                  <th scope="col" className="pb-2 text-right">Rate</th>
                  <th scope="col" className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 font-medium text-ink">
                      {item.title}
                      {item.size ? ` (${item.size})` : ""}
                    </td>
                    <td className="py-2 text-center font-mono text-ink-muted">6204</td>
                    <td className="py-2 text-center text-ink-secondary">{item.quantity}</td>
                    <td className="py-2 text-right font-mono text-ink-secondary">{money(item.price)}</td>
                    <td className="py-2 text-right font-mono font-medium text-ink">{money(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-line flex justify-end">
            <div className="w-full sm:w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-secondary">
                <span>Subtotal:</span>
                <span className="font-mono">{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Discount:</span>
                <span className="font-mono text-success">- {money(order.discount)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Integrated GST (12% incl.):</span>
                <span className="font-mono">Included</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Shipping:</span>
                <span className="font-mono">{money(order.shipping)}</span>
              </div>
              <div className="pt-2 border-t border-ink flex justify-between font-bold text-base text-ink">
                <span>Grand Total:</span>
                <span className="font-mono">{money(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-ink-muted leading-tight">
            <p className="text-ink-secondary text-sm">&ldquo;Every stitch carries the legacy of master craftsmen.&rdquo;</p>
            <p>Computer generated invoice. Requires no physical signature.</p>
          </div>
          <button type="button" onClick={handlePrint} className={btnSmall}>
            <Printer className="w-4 h-4" aria-hidden="true" />
            Print / Save PDF
          </button>
        </div>
      </AccountModal>

      {/* MODAL 2: SHIPMENT TRACKING (stored shipments only) */}
      <AccountModal open={showTrackingModal} onClose={() => setShowTrackingModal(false)} title="Shipment Tracking">
        <p className="-mt-2 mb-4 text-sm text-ink-muted font-mono">Order {order.orderNumber}</p>
        <div className="space-y-4">
          {order.shipments.length === 0 ? (
            <p className="text-base text-ink-secondary">
              Your order has not shipped yet. Courier and tracking details will appear here once your package is dispatched.
            </p>
          ) : (
            order.shipments.map((sh) => (
              <div key={sh.id} className="rounded-xl bg-surface-muted p-4 space-y-1">
                <p className="text-base font-semibold text-ink">
                  {sh.carrier} &bull; <span className="font-mono">{sh.trackingNumber}</span>
                </p>
                {sh.status && <p className="text-sm text-ink-secondary">Status: {sh.status}</p>}
                {sh.shippedAt && <p className="text-sm text-ink-muted">Shipped: {sh.shippedAt}</p>}
                {sh.deliveredAt ? (
                  <p className="text-sm text-ink-muted">Delivered: {sh.deliveredAt}</p>
                ) : (
                  sh.estimatedDelivery && <p className="text-sm text-ink-muted">Estimated delivery: {sh.estimatedDelivery}</p>
                )}
                {sh.trackingUrl && /^https?:\/\//i.test(sh.trackingUrl) && (
                  <a
                    href={sh.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
                  >
                    Track on the courier site <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
        <button type="button" onClick={() => setShowTrackingModal(false)} className={`${btnPrimary} w-full mt-6`}>
          Close Tracking
        </button>
      </AccountModal>

      {/* MODAL 3: CONCIERGE SUPPORT */}
      <AccountModal
        open={showSupportModal}
        onClose={() => {
          setShowSupportModal(false);
          setSupportSubmitted(false);
        }}
        title={supportSubmitted ? "Message Received" : "Customer Support"}
      >
        {supportSubmitted ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <p role="status" className="text-base text-ink-secondary leading-relaxed">
              Thank you, {order.recipient.name}. A representative from our customer support team will connect with you via email or phone within 2 business hours.

            </p>
            <button
              type="button"
              onClick={() => {
                setShowSupportModal(false);
                setSupportSubmitted(false);
              }}
              className={btnPrimary}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <p className="-mt-2 text-sm text-ink-muted">Order Ref: #{order.orderNumber}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendSupportRequest();
              }}
              className="mt-5 space-y-5"
            >
              <div>
                <label htmlFor="support-reason" className={labelClass}>
                  Reason for Inquiry
                </label>
                <select
                  id="support-reason"
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                  className={inputClass()}
                >
                  <option>Delivery assistance or update</option>
                  <option>Exchange / Size alteration request</option>
                  <option>Garment embroidery care consultation</option>
                  <option>Invoice or payment inquiry</option>
                  <option>Other inquiry</option>
                </select>
              </div>

              <div>
                <label htmlFor="support-message" className={labelClass}>
                  Your Message
                </label>
                <textarea
                  id="support-message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Please describe how we can assist you with your order..."
                  aria-describedby={supportError ? "support-error" : undefined}
                  className={textareaClass}
                />
                {supportError && (
                  <p id="support-error" role="alert" className="mt-1.5 text-sm text-error">
                    {supportError}
                  </p>
                )}
              </div>

              <button type="submit" disabled={supportSending} className={`${btnPrimary} w-full`}>
                {supportSending ? "Sending..." : "Send Message to Support"}
              </button>
            </form>
          </div>
        )}
      </AccountModal>

      <RequestDialog
        open={requestDialog !== null}
        onClose={() => setRequestDialog(null)}
        orderNumber={order.orderNumber}
        initialMode={requestDialog || lastDialog.current}
        onSubmitted={refreshOrder}
      />

      {buyAgainMessage && (
        <div role="alert" className="fixed bottom-24 lg:bottom-6 right-4 z-50 max-w-xs bg-inverse text-on-inverse text-sm px-4 py-3 rounded-lg shadow-luxury flex items-start gap-3">
          <span>{buyAgainMessage}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setBuyAgainMessage("")} className="-m-2 p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </AccountShell>
  );
}
