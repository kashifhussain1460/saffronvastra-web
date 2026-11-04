import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

const description = "Look up your order with the order number and the email address used at checkout.";

export const metadata: Metadata = {
  title: "Track Your Order",
  description,
  openGraph: { ...BASE_OG, url: "/track-order", title: titleFor("Track Your Order"), description },
  // an order lookup is a utility page, not something to list in search results
  robots: { index: false, follow: true },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
