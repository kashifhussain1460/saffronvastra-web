// Meta Pixel standard events for the shop. Every call is a no-op unless the Pixel is loaded, which only happens after
// the visitor allowed marketing cookies (components/analytics/MetaPixel) and never on admin pages. Amounts are rupees,
// the currency is always INR, and no personal data (name, email, phone, address) is ever sent from here.
import type { GaItem } from "@/lib/gtag";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENTS: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
};

const value = (items: GaItem[]) =>
  Math.round(items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0) * 100) / 100;

function payload(items: GaItem[]) {
  return {
    content_type: "product",
    content_ids: items.map((it) => it.item_id),
    contents: items.map((it) => ({ id: it.item_id, quantity: it.quantity || 1, item_price: it.price || 0 })),
    num_items: items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    currency: "INR",
    value: value(items),
  };
}

/** Sends the Meta equivalent of a GA4 ecommerce event (view_item, add_to_cart, begin_checkout, add_payment_info). */
export function metaItemsEvent(gaName: string, items: GaItem[]): void {
  const name = META_EVENTS[gaName];
  if (!name || !items.length || typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", name, payload(items));
  } catch {
    // tracking must never break the shop
  }
}

/**
 * Purchase, once per order per browser. The order number is the event id: the server sends the same Purchase through
 * the Conversions API with the same id, and Meta counts the pair once.
 */
export function metaPurchaseOnce(orderNumber: string, items: GaItem[], amount: number): void {
  if (!orderNumber || !items.length || typeof window === "undefined" || typeof window.fbq !== "function") return;
  const key = `meta_purchase_${orderNumber}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // storage blocked: Meta's event id de-duplication still applies
  }
  try {
    window.fbq("track", "Purchase", { ...payload(items), value: amount }, { eventID: orderNumber });
  } catch {}
  // server-side twin (Conversions API): the API reads the amount and contact details from the stored order itself
  fetch("/api/v1/tracking/meta/purchase", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber }),
  }).catch(() => {});
}
