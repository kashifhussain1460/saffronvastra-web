import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

// Search result pages are endless query variations: keep them out of the index but let crawlers follow product links.
// openGraph is set here so the page does not inherit the root Open Graph fields of the home page.
export const metadata: Metadata = {
  title: "Search",
  openGraph: { ...BASE_OG, url: "/search", title: titleFor("Search") },
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
