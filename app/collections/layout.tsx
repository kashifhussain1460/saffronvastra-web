import type { Metadata } from "next";
import { BRAND_TITLE_SUFFIX } from "@/lib/seo";

// A plain string title here would drop the root template for /collections/[slug], so the template is repeated.
// The /collections page sets its own title, description, canonical and Open Graph per view (page.tsx), and each
// collection page sets its own, so nothing else is inherited from here.
export const metadata: Metadata = {
  title: { default: "Shop the Collection", template: `%s | ${BRAND_TITLE_SUFFIX}` },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
