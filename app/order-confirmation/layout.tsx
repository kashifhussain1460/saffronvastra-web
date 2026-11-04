import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

// An order confirmation is personal to one buyer: keep it out of search results
// (next.config also sends an X-Robots-Tag header). openGraph is set here so the page
// does not inherit the root og:url of the home page.
export const metadata: Metadata = {
  title: "Order Confirmation",
  openGraph: { ...BASE_OG, url: "/order-confirmation", title: titleFor("Order Confirmation") },
  robots: { index: false, follow: false },
};

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
