import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

// Page title only: noindex comes from the X-Robots-Tag header in next.config.
// openGraph is set here so the page does not inherit the root og:url of the home page.
export const metadata: Metadata = {
  title: "Your Cart",
  openGraph: { ...BASE_OG, url: "/cart", title: titleFor("Your Cart") },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
