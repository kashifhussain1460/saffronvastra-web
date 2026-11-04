import { BRAND } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PolicyLayout, { PolicySection, policyList, policyNote } from "@/components/content/PolicyLayout";

export const metadata = buildMetadata({
  title: "Shipping & Delivery Policy",
  description:
    `Domestic shipping policy, handcrafted dispatch timelines, and delivery terms across India for ${BRAND.displayName}.`,
  path: "/policies/shipping",
});

const sections = [
  { id: "domestic-shipping", label: "1. Domestic Shipping Across India" },
  { id: "dispatch-timeline", label: "2. Handcrafted Dispatch Timelines (5–7 Working Days)" },
  { id: "delivery-estimates", label: "3. Delivery Estimates & Logistics Partners" },
  { id: "international-shipping", label: "4. International Shipping Status" },
  { id: "packaging", label: "5. Protective Garment Packaging" },
  { id: "tracking", label: "6. Order Tracking & Dispatch Updates" },
];

const strong = "text-ink font-medium";

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping & Delivery Policy"
      crumb="Shipping & Delivery"
      intro={`Every ${BRAND.displayName} garment is individually prepared in our Jaipur workshop and delivered safely to your doorstep across India.`}
      sections={sections}
      summary={{
        title: "At a Glance",
        items: [
          "Free Shipping across India on orders above ₹5,000",
          "Calculated Shipping on orders below ₹5,000 at checkout",
          "5–7 Working Days: dispatch time from our Jaipur workshop",
          "2–4 Working Days: transit & delivery time post-dispatch",
          "Service Area: Delivery across eligible Indian PIN codes only",
        ],
        footer: (
          <div className="space-y-2">
            <p className="text-sm text-ink-secondary">Need help with an address or tracking an existing order?</p>
            <Link href="/contact" className="inline-flex items-center min-h-11 text-sm font-semibold text-ink underline underline-offset-4 hover:text-primary-hover">
              Contact Customer Support
            </Link>
          </div>
        ),
      }}
      links={{
        title: "Explore Other Policies",
        items: [
          { href: "/policies/returns", label: "Returns, Exchanges & Cancellations" },
          { href: "/payment-methods", label: "Payment Methods" },
          { href: "/order-cancellation", label: "Order Cancellation" },
          { href: "/policies/terms", label: "Terms & Conditions" },
        ],
      }}
    >
      <PolicySection id="domestic-shipping" title={sections[0].label}>
        <p>
          We deliver to serviceable PIN codes across India via reputable national logistics providers.
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Orders Above ₹5,000:</strong> Free complimentary standard shipping across India.</li>
          <li><strong className={strong}>Orders Below ₹5,000:</strong> Shipping charges are calculated based on delivery location and shipment weight, and clearly displayed at checkout before payment.</li>
          <li><strong className={strong}>Cash on Delivery (COD):</strong> Available on eligible PIN codes. COD serviceability and any applicable limit are verified directly during checkout.</li>
        </ul>
      </PolicySection>

      <PolicySection id="dispatch-timeline" title={sections[1].label}>
        <p>
          Each garment at {BRAND.displayName} is handcrafted and carefully inspected before dispatch.
        </p>
        <div className={policyNote}>
          <p><strong className={strong}>Dispatch Time:</strong> 5 to 7 working days from the date of order confirmation.</p>
          <p><strong className={strong}>Important Note:</strong> Dispatch time refers to the preparation period before the parcel is handed over to the courier. Delivery transit time is calculated separately.</p>
        </div>
      </PolicySection>

      <PolicySection id="delivery-estimates" title={sections[2].label}>
        <p>
          Once dispatched from our Jaipur workshop, estimated courier transit times are:
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 2 to 3 business days post-dispatch.</li>
          <li><strong className={strong}>Rest of India (Tier 2, Tier 3 cities &amp; regional areas):</strong> 3 to 5 business days post-dispatch.</li>
          <li><strong className={strong}>Courier Partners:</strong> Trusted national couriers including BlueDart, Delhivery, DTDC, and India Post.</li>
        </ul>
      </PolicySection>

      <PolicySection id="international-shipping" title={sections[3].label}>
        <div className="rounded-xl border border-line bg-surface-muted p-5 space-y-2">
          <p className="font-semibold text-ink">International Shipping Currently Unavailable</p>
          <p className="text-sm text-ink-secondary leading-relaxed">
            {BRAND.displayName} currently operates exclusively within India. We do not support international deliveries or overseas orders at this time. All checkout orders must provide a valid 6-digit Indian PIN code and Indian delivery address.
          </p>
        </div>
      </PolicySection>

      <PolicySection id="packaging" title={sections[4].label}>
        <p>
          Every garment is carefully folded, placed in protective packaging, and secured in tamper-evident boxes to ensure it reaches you in pristine condition.
        </p>
      </PolicySection>

      <PolicySection id="tracking" title={sections[5].label}>
        <p>
          As soon as your shipment is dispatched, you will receive an SMS and email notification with your AWB tracking number and courier tracking link. You can also view real-time updates directly in your account dashboard.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-ink underline underline-offset-4 hover:text-primary-hover"
        >
          <span>Track an Existing Order</span>
          <ArrowRight aria-hidden="true" className="w-4 h-4" />
        </Link>
      </PolicySection>
    </PolicyLayout>
  );
}
