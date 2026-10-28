import { BRAND } from "@/lib/brand";
import PolicyMarkdown, { fillPlaceholders } from "@/components/content/PolicyMarkdown";
import { PRIVACY_MARKDOWN } from "@/lib/policies/privacy";

export const metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description: `${BRAND.displayName}, operated by ${BRAND.legalName}, respects your privacy and is committed to handling your personal information responsibly.`,
};

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
