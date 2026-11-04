import { BRAND } from "@/lib/brand";
import type { Metadata, Viewport } from "next";
import { API_ORIGIN, INDEXING_ALLOWED, SITE_URL } from "@/lib/site";
import { BASE_OG, BRAND_TITLE_SUFFIX, THEME_COLOR } from "@/lib/seo";
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
import JsonLd from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/jsonld";

export const metadata: Metadata = {
  // canonical, Open Graph and sitemap URLs resolve against the public origin of this environment
  metadataBase: new URL(SITE_URL),
  // pages set only their own part of the title; the template adds the brand suffix
  title: {
    default: `${BRAND.name} | Luxury Embroidered Fashion & Made-to-Order Craft`,
    template: `%s | ${BRAND_TITLE_SUFFIX}`,
  },
  description:
    "Handcrafted luxury velvet jackets, artisanal kimonos, and timeless embroidered co-ords. Made to order with heritage craftsmanship for the modern wardrobe.",
  // no url here: each page sets its own og:url, so a route without one never claims the home URL
  openGraph: { ...BASE_OG },
  // staging and preview builds must not be indexed even if a crawler ignores robots.txt
  robots: INDEXING_ALLOWED ? undefined : { index: false, follow: false },
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
    const res = await fetch(`${API_ORIGIN}${path}`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
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
        {/* Organization and WebSite, once per page */}
        <JsonLd data={siteGraph()} />
        <SettingsProvider settings={settings}>
          <StoreProvider>
            <AnalyticsTracker />
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
