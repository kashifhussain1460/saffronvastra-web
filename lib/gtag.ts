// GA4 events through the site's single Google tag (components/analytics/GoogleTag). Every call is a no-op where the
// tag is not loaded (localhost, staging, previews, admin), and Consent Mode decides what Google may store.
// Amounts are rupees; the currency is always INR. Never put personal data (name, email, phone, address, payment
// details) in these parameters.
import { metaItemsEvent, metaPurchaseOnce } from "@/lib/metaPixel";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface GaItem {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
  item_variant?: string;
  item_category?: string;
  item_list_id?: string;
  item_list_name?: string;
  index?: number;
}

export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    // analytics must never break the shop
  }
}

// Value of a list of items in rupees (price × quantity; shipping and tax are never part of it).
export const itemsValue = (items: GaItem[]): number =>
  Math.round(items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0) * 100) / 100;

// GA4 item from a storefront product ({ id, slug, title, price, category? }).
export function productItem(
  product: { id?: string; slug?: string; title?: string; price?: number; category?: string | null },
  extra: Partial<GaItem> = {}
): GaItem {
  return {
    item_id: String(product.slug || product.id || ""),
    ...(product.title ? { item_name: product.title } : {}),
    ...(typeof product.price === "number" ? { price: product.price } : {}),
    ...(product.category ? { item_category: product.category } : {}),
    ...extra,
  };
}

// Sends an event that describes the whole cart or order (value = sum of the items).
export function gaItemsEvent(name: string, items: GaItem[], extra: Record<string, unknown> = {}): void {
  if (!items.length) return;
  metaItemsEvent(name, items); // the Meta Pixel twin of the same event (no-op without marketing consent)
  gaEvent(name, { currency: "INR", value: itemsValue(items), items, ...extra });
}

// purchase is sent once per order per browser, however often the confirmation page is reloaded or revisited.
// GA4 also ignores a repeated purchase with the same transaction_id, as a second safety net.
export function gaPurchaseOnce(orderNumber: string, items: GaItem[], extra: Record<string, unknown> = {}): void {
  // goods value after discount, same as GA4
  metaPurchaseOnce(orderNumber, items, typeof extra.value === "number" ? extra.value : itemsValue(items));
  if (typeof window === "undefined" || typeof window.gtag !== "function" || !orderNumber || !items.length) return;
  const key = `ga4_purchase_${orderNumber}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // storage blocked: GA4's own transaction_id de-duplication still applies
  }
  gaEvent("purchase", { transaction_id: orderNumber, currency: "INR", value: itemsValue(items), items, ...extra });
}
