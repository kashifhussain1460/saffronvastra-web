import type { Metadata } from "next";
import { BASE_OG, BRAND_TITLE_SUFFIX, titleFor } from "@/lib/seo";

// One neutral title for every auth screen (the pages are client components and cannot set their own).
// The template lets a future server page under /auth set its own title. Pass-through only: StorefrontShell
// hides the header and footer for /auth by pathname, so no wrapper is needed here.
// noindex is also sent as an X-Robots-Tag header by next.config; openGraph has no url because this layout
// covers several routes, and setting it stops the pages inheriting the root og:url of the home page.
export const metadata: Metadata = {
  title: { default: "Account", template: `%s | ${BRAND_TITLE_SUFFIX}` },
  openGraph: { ...BASE_OG, title: titleFor("Account") },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
