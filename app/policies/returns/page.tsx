import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import PolicyLayout, { PolicySection, policyList, policyLink, policyNote } from "@/components/content/PolicyLayout";

export const metadata = {
  title: `Returns, Exchanges & Cancellation Policy | ${BRAND.displayName}`,
  description:
    `Seven-day exchange policy, damaged item resolutions, and 24-hour cancellation terms at ${BRAND.displayName}.`,
};

const sections = [
  { id: "returns-exchanges", label: "1. 7-Day Standard Returns (Exchange Only)" },
  { id: "damaged-incorrect", label: "2. Damaged or Incorrect Products (Replacement or Refund)" },
  { id: "cancellations", label: "3. Order Cancellation Window (Within 24 Hours)" },
  { id: "eligibility", label: "4. Return Eligibility & Inspection Criteria" },
  { id: "how-to", label: "5. How to Report an Exchange, Defect or Cancellation" },
];

const strong = "text-ink font-medium";

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout
      title="Returns, Exchanges & Cancellations"
      crumb="Returns & Exchanges"
      intro={`At ${BRAND.displayName}, each garment is handcrafted with meticulous care. We offer 7-day exchanges, comprehensive support for damaged or incorrect items, and a 24-hour order cancellation window.`}
      sections={sections}
      summary={{
        title: "Policy Summary",
        items: [
          "7-Day Return Eligibility: begins from the date of delivery",
          "Exchange Only: standard returns are resolved via size or product exchange",
          "No Change-of-Mind Cash Refunds: standard returns eligible for exchange",
          "Damaged/Incorrect: free replacement or full refund to original payment method",
          "Cancellation: eligible within 24 hours of placing order (prior to dispatch)",
        ],
        footer: (
          <Link
            href="/contact"
            className="flex items-center justify-center text-center min-h-12 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Contact Customer Support
          </Link>
        ),
      }}
      links={{
        title: "Helpful Information",
        items: [
          { href: "/order-cancellation", label: "Order Cancellation Guidelines" },
          { href: "/payment-methods", label: "Supported Payment Methods" },
          { href: "/policies/shipping", label: "Shipping & Fulfillment Terms" },
          { href: "/size-guide", label: "Unisex Sizing Guide" },
        ],
      }}
    >
      <PolicySection id="returns-exchanges" title={sections[0].label}>
        <p>
          We want you to feel confident and comfortable in every garment you receive. Customers are eligible to request an exchange within <strong className={strong}>7 calendar days from the date of delivery</strong>.
        </p>
        <div className={policyNote}>
          <p><strong className={strong}>Exchange Only:</strong> Eligible standard returns are handled through exchange for an alternative size or product. We do not provide automatic monetary or cash refunds for ordinary change-of-mind returns.</p>
          <p><strong className={strong}>Reverse Pickup:</strong> We arrange doorstep reverse pickup across serviceable Indian PIN codes for approved exchange requests.</p>
        </div>
      </PolicySection>

      <PolicySection id="damaged-incorrect" title={sections[1].label}>
        <p>
          If you receive a product that is damaged during transit, defective, or different from what you ordered:
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Free Resolution:</strong> You will receive a completely free resolution at zero additional cost.</li>
          <li><strong className={strong}>Replacement or Refund:</strong> Eligible cases will be resolved promptly through a free replacement garment or a full refund.</li>
          <li><strong className={strong}>Refund Method:</strong> All monetary refunds for verified damaged or incorrect items are processed directly back to your original payment method (bank account, card, or UPI) within 5–7 business days.</li>
          <li><strong className={strong}>Reporting Deadline:</strong> Please notify customer support within 48 to 72 hours of receiving the parcel, including clear photos or videos of the issue.</li>
        </ul>
      </PolicySection>

      <PolicySection id="cancellations" title={sections[2].label}>
        <p>
          We understand that circumstances may change after an order is placed:
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>24-Hour Window:</strong> You can request cancellation of your order within <strong className={strong}>24 hours</strong> of placing it.</li>
          <li><strong className={strong}>Pre-Dispatch Condition:</strong> Cancellation eligibility requires that the order has not already entered the courier dispatch process. Once dispatched, the order cannot be cancelled and must follow the standard return/exchange procedure upon arrival.</li>
          <li><strong className={strong}>Full Refund on Cancellation:</strong> If cancelled within 24 hours prior to dispatch, prepaid online orders will receive a 100% refund to the original payment source.</li>
        </ul>
      </PolicySection>

      <PolicySection id="eligibility" title={sections[3].label}>
        <p>To qualify for an exchange or return inspection, garments must meet the following criteria:</p>
        <ul className={policyList}>
          <li>Garment must be in original, unwashed, and unworn condition.</li>
          <li>All original brand tags, labels, and protective packaging must be intact.</li>
          <li>Items showing signs of wear, perfume scents, makeup stains, or alterations cannot be accepted.</li>
        </ul>
      </PolicySection>

      <PolicySection id="how-to" title={sections[4].label}>
        <p>
          <strong className={strong}>Step 1:</strong> Contact customer support via email at{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className={`${policyLink} font-medium`}>{BRAND.supportEmail}</a> or WhatsApp / Phone at{" "}
          <a href={`https://wa.me/${BRAND.phone.replace(/[^0-9]/g, "")}`} className={`${policyLink} font-medium`}>{BRAND.phone}</a>.
        </p>
        <p>
          <strong className={strong}>Step 2:</strong> Mention your Order ID (e.g. #ST66223), the item name, and whether you are requesting a size exchange, reporting damage, or requesting a 24-hour cancellation.
        </p>
        <p>
          <strong className={strong}>Step 3:</strong> For exchanges, securely pack the garment in its packaging. Our courier partner will pick it up from your address. Once inspected at our Jaipur workshop, your exchange item will be prepared and dispatched.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
