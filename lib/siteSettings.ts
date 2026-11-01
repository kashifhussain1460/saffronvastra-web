// Public store settings (announcement bar, contact details, shipping rules). Read on the server for every page,
// with the shop's long-standing values as the fallback if the API cannot be reached.
import { BRAND } from "@/lib/brand";
export interface SiteSettings {
  store: { name: string; supportEmail: string; supportPhone: string; address: string };
  announcement: { enabled: boolean; text: string; link: string };
  shipping: { freeShippingThreshold: number; flatFee: number; deliveryChargesEnabled?: boolean };
  cod: { enabled: boolean; fee: number };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  store: {
    name: `${BRAND.displayName}`,
    supportEmail: `${BRAND.supportEmail}`,
    supportPhone: "+91 82093 43979",
    address: "125, Abdul Hameed Nagar, Panch Batti, M.I. Road, Jaipur, Rajasthan 302001, India",
  },
  announcement: { enabled: true, text: "Complimentary shipping across India on orders above ₹5,000", link: "" },
  shipping: { freeShippingThreshold: 5000, flatFee: 499, deliveryChargesEnabled: true },
  cod: { enabled: true, fee: 0 },
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const origin = process.env.API_ORIGIN || "http://127.0.0.1:4000";
  const envToggle = process.env.NEXT_PUBLIC_ENABLE_DELIVERY_CHARGES || process.env.ENABLE_DELIVERY_CHARGES;
  const isEnvDisabled = envToggle === "false" || envToggle === "0";
  try {
    const res = await fetch(`${origin}/api/v1/settings`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      if (isEnvDisabled) {
        return {
          ...DEFAULT_SITE_SETTINGS,
          shipping: { ...DEFAULT_SITE_SETTINGS.shipping, flatFee: 0, freeShippingThreshold: 0, deliveryChargesEnabled: false },
        };
      }
      return DEFAULT_SITE_SETTINGS;
    }
    const body = await res.json();
    const d = body?.data || {};
    const deliveryChargesDisabled = isEnvDisabled || d.shipping?.deliveryChargesEnabled === false || d.shipping?.flatFee === 0;

    return {
      store: { ...DEFAULT_SITE_SETTINGS.store, ...d.store },
      announcement: { ...DEFAULT_SITE_SETTINGS.announcement, ...d.announcement },
      shipping: {
        ...DEFAULT_SITE_SETTINGS.shipping,
        ...d.shipping,
        ...(deliveryChargesDisabled ? { flatFee: 0, freeShippingThreshold: 0, deliveryChargesEnabled: false } : { deliveryChargesEnabled: true }),
      },
      cod: { ...DEFAULT_SITE_SETTINGS.cod, ...d.cod },
    };
  } catch {
    if (isEnvDisabled) {
      return {
        ...DEFAULT_SITE_SETTINGS,
        shipping: { ...DEFAULT_SITE_SETTINGS.shipping, flatFee: 0, freeShippingThreshold: 0, deliveryChargesEnabled: false },
      };
    }
    return DEFAULT_SITE_SETTINGS;
  }
}
