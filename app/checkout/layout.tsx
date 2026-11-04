import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

// Page title only: noindex comes from the X-Robots-Tag header in next.config.
// openGraph is set here so the page does not inherit the root og:url of the home page.
export const metadata: Metadata = {
  title: "Checkout",
  openGraph: { ...BASE_OG, url: "/checkout", title: titleFor("Checkout") },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
