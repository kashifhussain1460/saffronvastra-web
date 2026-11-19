import { BRAND } from "@/lib/brand";
import type { Metadata, Viewport } from "next";
import { API_ORIGIN, INDEXING_ALLOWED, SITE_URL } from "@/lib/site";
import { BASE_OG, BRAND_TITLE_SUFFIX, DEFAULT_OG_IMAGE, THEME_COLOR } from "@/lib/seo";
import { Kumbh_Sans } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";
import "./a11y.css";
import { StoreProvider } from "@/context/StoreContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { fetchSiteSettings } from "@/lib/siteSettings";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import type { CatalogNavData } from "@/components/layout/useCatalogNav";

// Single unified font family for the entire website: Kumbh Sans (Variable font)
const kumbh = Kumbh_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

import StorefrontShell from "@/components/layout/StorefrontShell";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import MetaPixel from "@/components/analytics/MetaPixel";
import GoogleTag from "@/components/analytics/GoogleTag";
import ConsentBanner from "@/components/analytics/ConsentBanner";

// Meta (Facebook) Pixel ID, read at runtime. Set only on the live site so staging and local traffic stay out of Meta.
const META_PIXEL_ID = process.env.META_PIXEL_ID?.trim() || "";
// Google tag of the GA4 web data stream (it carries the GA4 destination GA_MEASUREMENT_ID). Loaded once, only on the
// production deployment (ALLOW_INDEXING=true) and, in the browser, only on the live hostnames below.
const GOOGLE_TAG_ID = INDEXING_ALLOWED ? process.env.GOOGLE_TAG_ID?.trim() || "" : "";
// The live hostnames: the canonical one and its bare/www twin (the twin only ever redirects, but costs nothing).
const LIVE_HOSTS = (() => {
  const host = new URL(SITE_URL).hostname;
  return [host, host.startsWith("www.") ? host.slice(4) : `www.${host}`];
})();
// Search Console HTML-tag verification token (the content value of google-site-verification). Optional when the
// property is verified by DNS instead.
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim() || "";
// Pinterest's HTML-tag website verification code (Settings > Claimed accounts > Websites).
const PINTEREST_DOMAIN_VERIFY = "c19ec23cfda5297dfcc0d37d983e1dba";
import JsonLd from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/jsonld";

export const metadata: Metadata = {
  // canonical, Open Graph and sitemap URLs resolve against the public origin of this environment
  metadataBase: new URL(SITE_URL),
  // pages set only their own part of the title; the template adds the brand suffix
  title: {
    default: `${BRAND.displayName} | Luxury Embroidered Fashion & Made-to-Order Craft`,
    template: `%s | ${BRAND_TITLE_SUFFIX}`,
  },
  // inherited only by pages without a description of their own (today the noindex cart, checkout, auth and search pages)
  description:
    "Hand-embroidered Suzani jackets, kimonos and waistcoats in velvet and cotton, made to order by artisans in Jaipur and delivered across India.",
  // no url here: each page sets its own og:url, so a route without one never claims the home URL
  openGraph: { ...BASE_OG, images: [DEFAULT_OG_IMAGE] },
  // staging and preview builds must not be indexed even if a crawler ignores robots.txt
  robots: INDEXING_ALLOWED ? undefined : { index: false, follow: false },
  verification: {
    ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
    // Pinterest website claim for the business account SaffronVastra (@kashifhussain146): needed for its product
    // catalog and for attribution on Pins that link here. Public by design (it is read from the page head).
    other: { "p:domain_verify": PINTEREST_DOMAIN_VERIFY },
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

// Categories and collections for the header mega menu and the footer, read here so their links are in the server HTML.
// Only the fields the navigation uses are passed on. Any failure or a slow API returns null, and the navigation then
// loads in the browser as before.
const NAV_CATEGORY_FIELDS = ["id", "name", "slug", "parentId", "status", "productsCount", "image", "bannerImage", "shortDescription"];
const NAV_COLLECTION_FIELDS = ["title", "slug", "status", "bannerImage"];

const pick = (row: any, fields: string[]) =>
  Object.fromEntries(fields.filter((f) => row?.[f] !== undefined).map((f) => [f, row[f]]));

async function getNavList(path: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : null;
  } catch {
    return null;
  }
}

async function fetchCatalogNavData(): Promise<CatalogNavData | null> {
  const [categories, collections] = await Promise.all([getNavList("/api/v1/categories"), getNavList("/api/v1/collections")]);
  if (!categories || !collections) return null;
  return {
    categories: categories.map((c) => pick(c, NAV_CATEGORY_FIELDS)),
    collections: collections.map((c) => pick(c, NAV_COLLECTION_FIELDS)),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // product photos are hotlinked from Etsy: open that connection early (no crossorigin: plain <img> requests)
  preconnect("https://i.etsystatic.com");
  const [settings, navData] = await Promise.all([fetchSiteSettings(), fetchCatalogNavData()]);
  return (
    <html lang="en-IN" className={kumbh.variable}>
      <body className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-surface-muted selection:text-secondary">
        {/* Organization (with the support contact the footer shows) and WebSite, once per page */}
        <JsonLd data={siteGraph(settings.store)} />
        <SettingsProvider settings={settings}>
          <StoreProvider>
            <AnalyticsTracker />
            {META_PIXEL_ID && <MetaPixel pixelId={META_PIXEL_ID} />}
            {GOOGLE_TAG_ID && <GoogleTag tagId={GOOGLE_TAG_ID} hosts={LIVE_HOSTS} />}
            {/* cookie choices wherever an optional tracker is configured (the live site) */}
            {(GOOGLE_TAG_ID || META_PIXEL_ID) && <ConsentBanner />}
            <StorefrontShell
              announcement={<AnnouncementBar announcement={settings.announcement} store={settings.store} />}
              navData={navData}
            >
              {children}
            </StorefrontShell>
          </StoreProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
