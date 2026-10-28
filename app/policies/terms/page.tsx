import { BRAND } from "@/lib/brand";
import PolicyMarkdown from "@/components/content/PolicyMarkdown";
import { TERMS_MARKDOWN } from "@/lib/policies/terms";

export const metadata = {
  title: `Terms & Conditions | ${BRAND.name}`,
  description:
    "These Terms & Conditions govern your access to and use of https://saffronvastra.com, including the purchase of products offered through our website.",
};

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
