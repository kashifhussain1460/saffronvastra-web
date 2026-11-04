import { BRAND } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import React from "react";
import Link from "next/link";
import PolicyLayout, { PolicySection, policyList, policyLink, policyNote } from "@/components/content/PolicyLayout";

export const metadata = buildMetadata({
  title: "Order Cancellation Policy",
  description:
    `24-hour order cancellation window and refund procedures for orders placed at ${BRAND.displayName}.`,
  path: "/order-cancellation",
});

const sections = [
  { id: "cancellation-window", label: "1. 24-Hour Cancellation Policy" },
  { id: "dispatch-restriction", label: "2. Orders Already Dispatched" },
  { id: "refund-process", label: "3. Refund Process for Cancelled Orders" },
  { id: "how-to-cancel", label: "4. How to Submit a Cancellation Request" },
  { id: "cod-cancellation", label: "5. Cash on Delivery (COD) Cancellations" },
];

const strong = "text-ink font-medium";

export default function OrderCancellationPage() {
  return (
    <PolicyLayout
      title="Order Cancellation"
      crumb="Order Cancellation"
      intro={`At ${BRAND.displayName}, each piece is handcrafted upon order. We offer a 24-hour grace period during which you can cancel your order for a 100% full refund.`}
      sections={sections}
      summary={{
        title: "Cancellation Highlights",
        items: [
          "24-Hour Grace Period: cancel your order within 24 hours of placement",
          "Prior to Dispatch: cancellation applies before parcel handover to couriers",
          "100% Refund: full monetary refund back to original payment source",
          "Fast Processing: refund initiated within 24–48 hours upon approval",
        ],
        footer: (
          <div className="space-y-2">
            <p className="text-sm text-ink-secondary">Need to cancel an order placed within the last 24 hours?</p>
            <Link href="/contact" className="inline-flex items-center min-h-11 text-sm font-semibold text-ink underline underline-offset-4 hover:text-primary-hover">
              Contact Support Immediately
            </Link>
          </div>
        ),
      }}
      links={{
        title: "Related Information",
        items: [
          { href: "/policies/returns", label: "Returns & Exchanges Policy" },
          { href: "/policies/shipping", label: "Shipping & Fulfillment Timelines" },
          { href: "/payment-methods", label: "Payment Options" },
          { href: "/account/orders", label: "My Orders Dashboard" },
        ],
      }}
    >
      <PolicySection id="cancellation-window" title={sections[0].label}>
        <p>
          You may cancel any order placed on {BRAND.displayName} within <strong className={strong}>24 hours</strong> of purchase, provided the item has not already been prepared and handed over to our logistics partner.
        </p>
        <div className={policyNote}>
          <p><strong className={strong}>Full Refund:</strong> All prepaid online orders cancelled within the 24-hour window will receive a 100% full refund with zero cancellation or restocking penalty.</p>
        </div>
      </PolicySection>

      <PolicySection id="dispatch-restriction" title={sections[1].label}>
        <p>
          Once an order has been dispatched from our Jaipur workshop and assigned an AWB tracking number, it is in active transit with our courier partner and <strong className={strong}>cannot be cancelled</strong>.
        </p>
        <p>
          In such cases, please receive the package upon delivery and contact us to initiate our standard <Link href="/policies/returns" className={`${policyLink} font-medium`}>7-day exchange process</Link>.
        </p>
      </PolicySection>

      <PolicySection id="refund-process" title={sections[2].label}>
        <p>
          For approved cancellations:
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Original Payment Source:</strong> The refund will be credited directly to the card, UPI ID, or bank account used at checkout.</li>
          <li><strong className={strong}>Refund Timeline:</strong> Our finance team initiates the refund within 24 to 48 hours. The amount typically reflects in your bank statement within 5 to 7 business days, depending on your bank&apos;s processing cycle.</li>
          <li><strong className={strong}>Confirmation Email:</strong> You will receive an official cancellation and refund confirmation email containing the reversal transaction reference.</li>
        </ul>
      </PolicySection>

      <PolicySection id="how-to-cancel" title={sections[3].label}>
        <p>
          To cancel your order within 24 hours:
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Email:</strong> Send an email to <a href={`mailto:${BRAND.supportEmail}`} className={`${policyLink} font-medium`}>{BRAND.supportEmail}</a> with the subject line <em>&ldquo;Cancellation Request – [Your Order Number]&rdquo;</em>.</li>
          <li><strong className={strong}>WhatsApp / Phone:</strong> Message or call us directly at <a href={`https://wa.me/${BRAND.phone.replace(/[^0-9]/g, "")}`} className={`${policyLink} font-medium`}>{BRAND.phone}</a> with your Order ID for urgent requests.</li>
        </ul>
      </PolicySection>

      <PolicySection id="cod-cancellation" title={sections[4].label}>
        <p>
          For Cash on Delivery (COD) orders:
        </p>
        <p>
          You may cancel your COD order prior to courier dispatch by contacting customer support. We kindly request timely notice so that our craftsmen and logistics team do not dispatch the package unnecessarily.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}

