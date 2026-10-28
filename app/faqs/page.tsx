import { BRAND } from "@/lib/brand";
import FaqView from "@/components/content/FaqView";
import { FAQ_MARKDOWN } from "@/lib/policies/faqs";

export const metadata = {
  title: `FAQs | ${BRAND.name}`,
  description:
    "Find answers to common questions about our products, sizes, orders, payments, shipping, returns and customer support.",
};

// The wording lives in lib/policies/faqs.ts exactly as supplied by the business owner.
export default function FAQsPage() {
  return <FaqView markdown={FAQ_MARKDOWN} />;
}
