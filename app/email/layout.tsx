import type { Metadata } from "next";
import { BASE_OG, titleFor } from "@/lib/seo";

// Personal links from sale emails: never in search results.
export const metadata: Metadata = {
  title: "Email preferences",
  openGraph: { ...BASE_OG, title: titleFor("Email preferences") },
  robots: { index: false, follow: false },
};

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
