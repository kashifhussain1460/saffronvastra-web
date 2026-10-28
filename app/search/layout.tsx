import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";

// Search result pages are endless query variations: keep them out of the index but let crawlers follow product links.
export const metadata: Metadata = {
  title: `Search | ${BRAND.name}`,
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
