import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { Kumbh_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { fetchSiteSettings } from "@/lib/siteSettings";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Single unified font family for the entire website: Kumbh Sans (Variable font)
const kumbh = Kumbh_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

import StorefrontShell from "@/components/layout/StorefrontShell";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

export const metadata: Metadata = {
  // canonical, Open Graph and sitemap URLs resolve against the public origin of this environment
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: `${BRAND.name}`, type: "website", locale: "en_IN" },
  title: `${BRAND.name} | Luxury Embroidered Fashion & Made-to-Order Craft`,
  description:
    "Handcrafted luxury velvet jackets, artisanal kimonos, and timeless embroidered co-ords. Made to order with heritage craftsmanship for the modern wardrobe.",
  keywords: [
    `${BRAND.name}`,
    "velvet jacket",
    "hand embroidery",
    "kimono",
    "made to order",
    "artisanal fashion",
    "Indian luxury",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await fetchSiteSettings();
  return (
    <html lang="en" className={kumbh.variable}>
      <body className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-surface-muted selection:text-secondary">
        <SettingsProvider settings={settings}>
          <StoreProvider>
            <AnalyticsTracker />
            <StorefrontShell>{children}</StorefrontShell>
          </StoreProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
