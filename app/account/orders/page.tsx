"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { subscribeToNewsletter } from "@/lib/newsletter";
import AccountShell from "@/components/account/AccountShell";
import OrdersTable from "@/components/account/OrdersTable";
import { btnPrimary, btnSmall, sectionTitle } from "@/components/auth/ui";
import { Package, Check } from "lucide-react";

interface OrderItemInfo {
  product?: any;
  title: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
  color?: string;
}

interface HistoryOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  items: OrderItemInfo[];
  total: number;
  itemCount: number;
  paymentStatus: string;
  provider: string;
  hasInlineStepper?: boolean;
  stepperData?: {
    orderPlacedDate: string;
    processingDate: string;
    currentStep: number; // 1 to 5
  };
}

const shortDate = (value: string | null | undefined, withYear = true) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) })
    : "";

// Maps one API order for the list. Only stored values are used; nothing is invented.
function mapHistoryOrder(so: any): HistoryOrder {
  const steps: any[] = Array.isArray(so.stepper) ? so.stepper : [];
  const currentIndex = steps.findIndex((st) => st.isCurrent);
  const lastDone = steps.reduce((acc, st, i) => (st.isCompleted ? i : acc), -1);
  return {
    id: so.id,
    orderNumber: so.orderNumber,
    date: shortDate(so.createdAt),
    status: so.status || "",
    paymentStatus: so.paymentStatus || "",
    provider: so.paymentMethod?.provider || so.payments?.[0]?.provider || "",
    total: (so.totalMinor || 0) / 100,
    itemCount: Number(so.itemsCount ?? so.items?.length ?? 0),
    hasInlineStepper: so.status === "Processing" || so.status === "Ready to Ship",
    stepperData: {
      orderPlacedDate: shortDate(so.createdAt, false),
      processingDate: "Jaipur Atelier",
      currentStep: currentIndex >= 0 ? currentIndex + 1 : Math.max(lastDone + 1, 1),
    },
    items: (so.items || []).map((it: any) => ({
      title: it.productTitle || "",
      image: it.productImage || "/images/brand/saffronvastra-mark.png",
      size: it.size || "",
      quantity: it.quantity || 1,
      price: (it.unitPriceMinor || 0) / 100,
      color: it.colour || "",
    })),
  };
}

export default function OrderHistoryPage() {
  const [filterStatus, setFilterStatus] = useState<"All" | "Processing" | "Shipped" | "Delivered" | "Cancelled">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error" | "signin">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  // The list comes from the API only. A browser-side copy is never merged in, because it could show
  // orders that are not in this customer's account.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState("loading");
      try {
        const res = await fetch("/api/v1/me/orders", { credentials: "include" });
        if (cancelled) return;
        if (res.status === 401) {
          setLoadState("signin");
          return;
        }
        if (!res.ok) {
          setLoadState("error");
          return;
        }
        const body = await res.json();
        setOrders((Array.isArray(body.data) ? body.data : []).map(mapHistoryOrder));
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === "All" || o.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((it) => it.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate status counts
  const counts = {
    All: orders.length,
    Processing: orders.filter((o) => o.status === "Processing").length,
    Shipped: orders.filter((o) => o.status === "Shipped").length,
    Delivered: orders.filter((o) => o.status === "Delivered").length,
    Cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");

  return (
    <AccountShell
      title="My Orders"
      crumbs={[{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: "Orders" }]}
      active="orders"
    >
      <div className="space-y-6">
        <div>
          <h2 className={sectionTitle}>Your Orders</h2>
          <p className="mt-1 text-base text-ink-secondary">Track, manage and view all your purchases in one place.</p>
        </div>

        {/* Status filter */}
        <div className="border-b border-line overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-6 sm:gap-8 min-w-max" role="group" aria-label="Filter orders by status">
            {(["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const).map((tab) => {
              const isActive = filterStatus === tab;
              const label = tab === "All" ? "All Orders" : tab;
              return (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setFilterStatus(tab)}
                  className={`relative min-h-[44px] pb-2 text-base font-medium transition-colors ${
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {label} ({counts[tab]})
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        {loadState === "loading" ? (
          <p role="status" className="text-base text-ink-secondary py-12 text-center">Loading your orders...</p>
        ) : loadState === "error" ? (
          <div role="alert" className="rounded-2xl border border-line p-10 text-center space-y-3">
            <p className="text-base text-ink-secondary">We could not load your orders right now.</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={btnSmall}>
              Try again
            </button>
          </div>
        ) : loadState === "signin" ? (
          <div role="alert" className="rounded-2xl border border-line p-10 text-center space-y-3">
            <p className="text-base text-ink-secondary">Your session has expired. Please sign in again.</p>
            <Link href="/auth/login?redirect=%2Faccount%2Forders" className={btnSmall}>
              Sign in
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-line p-10 text-center space-y-4">
            <Package className="w-10 h-10 mx-auto text-ink-muted" strokeWidth={1.25} aria-hidden="true" />
            <h3 className="font-heading text-xl font-medium text-ink">
              {orders.length === 0 ? "No Bespoke Orders Yet" : "No Orders Found"}
            </h3>
            <p className="text-base text-ink-secondary max-w-md mx-auto">
              {orders.length === 0
                ? "You have not placed any bespoke atelier orders yet. Discover our curated collections crafted with rare heritage textiles and gold zardozi."
                : searchQuery
                ? `No orders matching "${searchQuery}". Try a different search term.`
                : `You have no ${filterStatus.toLowerCase()} orders at this time.`}
            </p>
            <Link href="/collections" className={btnPrimary}>
              Explore Collections
            </Link>
          </div>
        ) : (
          <OrdersTable
            caption="Your orders"
            rows={filteredOrders.map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              date: o.date,
              // an online order that is not paid yet reads as waiting for payment, not as placed
              status:
                o.provider === "CASHFREE" && o.status === "Pending" && o.paymentStatus !== "Paid"
                  ? o.paymentStatus === "Failed"
                    ? "Payment failed"
                    : "Waiting for payment"
                  : o.status,
              total: o.total,
              itemCount: o.itemCount,
            }))}
          />
        )}

        {/* Newsletter */}
        <section aria-labelledby="orders-newsletter-title" className="mt-6 rounded-2xl bg-surface-muted p-6 sm:p-8">
          <h2 id="orders-newsletter-title" className="font-heading text-xl sm:text-2xl font-medium text-ink">
            Be Part of the Saffron Circle
          </h2>
          <p className="mt-1 text-base text-ink-secondary max-w-lg">
            Get early access to new collections, exclusive offers and stories from our artisans.
          </p>
          <div className="mt-5 max-w-lg">
            {newsletterSubscribed ? (
              <p role="status" className="flex items-center gap-2 text-base font-medium text-success">
                <Check className="w-4 h-4" aria-hidden="true" />
                Thank you! You are now subscribed to the Saffron Circle.
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newsletterEmail.trim()) return;
                  setNewsletterError("");
                  const result = await subscribeToNewsletter(newsletterEmail, "orders");
                  if (result.ok) setNewsletterSubscribed(true);
                  else setNewsletterError(result.message);
                }}
                className="relative"
              >
                <label htmlFor="orders-newsletter-email" className="sr-only">
                  Your email for the newsletter
                </label>
                <input
                  id="orders-newsletter-email"
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="block w-full h-14 rounded-full border border-ink bg-surface pl-5 pr-36 text-base text-ink placeholder:text-ink-muted outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-6 rounded-full bg-primary text-on-primary text-base font-semibold hover:bg-primary-hover transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
            {newsletterError && (
              <p role="alert" className="text-sm text-error mt-2">
                {newsletterError}
              </p>
            )}
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
