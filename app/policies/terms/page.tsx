import { BRAND } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import PolicyMarkdown from "@/components/content/PolicyMarkdown";
import { TERMS_MARKDOWN } from "@/lib/policies/terms";

export const metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    `These Terms & Conditions govern your access to and use of ${BRAND.url}, including the purchase of products offered through our website.`,
  path: "/policies/terms",
});

// The wording lives in lib/policies/terms.ts exactly as supplied by the business owner.
export default function TermsPage() {
  return (
    <PolicyMarkdown
      markdown={TERMS_MARKDOWN}
      crumb="Terms & Conditions"
      links={{
        title: "Storefront Policies",
        items: [
          { href: "/policies/shipping", label: "Shipping & Delivery" },
          { href: "/policies/returns", label: "Returns & Alterations" },
          { href: "/policies/privacy", label: "Privacy Policy" },
        ],
      }}
    />
  );
}
