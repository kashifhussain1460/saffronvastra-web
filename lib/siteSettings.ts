// Public store settings (announcement bar, contact details, shipping rules). Read on the server for every page,
// with the shop's long-standing values as the fallback if the API cannot be reached.
import { BRAND } from "@/lib/brand";
export interface SiteSettings {
  store: { name: string; supportEmail: string; supportPhone: string; address: string };
  announcement: { enabled: boolean; text: string; link: string };
  shipping: { freeShippingThreshold: number; flatFee: number };
  cod: { enabled: boolean; fee: number };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  store: {
    name: `${BRAND.name}`,
    supportEmail: `concierge@${BRAND.domain}`,
    supportPhone: "+91 (0141) 287-4390",
    address: "14 Heritage Haveli Marg, C-Scheme, Jaipur, Rajasthan 302001, India",
  },
  announcement: { enabled: true, text: "Complimentary shipping on orders above ₹5,000", link: "" },
  shipping: { freeShippingThreshold: 5000, flatFee: 499 },
  cod: { enabled: true, fee: 0 },
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const origin = process.env.API_ORIGIN || "http://127.0.0.1:4000";
  try {
    const res = await fetch(`${origin}/api/v1/settings`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return DEFAULT_SITE_SETTINGS;
    const body = await res.json();
    const d = body?.data || {};
    return {
      store: { ...DEFAULT_SITE_SETTINGS.store, ...d.store },
      announcement: { ...DEFAULT_SITE_SETTINGS.announcement, ...d.announcement },
      shipping: { ...DEFAULT_SITE_SETTINGS.shipping, ...d.shipping },
      cod: { ...DEFAULT_SITE_SETTINGS.cod, ...d.cod },
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
