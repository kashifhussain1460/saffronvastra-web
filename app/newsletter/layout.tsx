import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

// Unsubscribe links are personal utility pages: keep them out of search results.
// openGraph is set here so the page does not inherit the root og:url of the home page.
export const metadata: Metadata = {
  title: "Unsubscribe",
  openGraph: { ...BASE_OG, title: titleFor("Unsubscribe") },
  robots: { index: false, follow: false },
};

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
