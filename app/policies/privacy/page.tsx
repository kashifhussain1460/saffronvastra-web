import { BRAND } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import PolicyMarkdown, { fillPlaceholders } from "@/components/content/PolicyMarkdown";
import { PRIVACY_MARKDOWN } from "@/lib/policies/privacy";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: `${BRAND.displayName}, operated by ${BRAND.legalName}, respects your privacy and is committed to handling your personal information responsibly.`,
  path: "/policies/privacy",
});

// The wording lives in lib/policies/privacy.ts exactly as supplied by the business owner.
export default function PrivacyPolicyPage() {
  return (
    <PolicyMarkdown
      markdown={fillPlaceholders(PRIVACY_MARKDOWN, BRAND)}
      crumb="Privacy Policy"
      links={{
        title: "Legal Documents",
        items: [
          { href: "/policies/terms", label: "Terms & Conditions" },
          { href: "/policies/shipping", label: "Shipping Policy" },
          { href: "/policies/returns", label: "Returns Policy" },
        ],
      }}
    />
  );
}
