import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import PolicyLayout, { PolicySection, policyList, policyLink, policyNote } from "@/components/content/PolicyLayout";

export const metadata = {
  title: `Returns & Free Alterations Policy | ${BRAND.name}`,
  description:
    `Learn about our size alterations policy, store credit guidelines, and made-to-order craft commitments at ${BRAND.name}.`,
};

const sections = [
  { id: "made-to-order", label: "1. The Made-to-Order Principle" },
  { id: "alterations", label: "2. Free Size Alterations" },
  { id: "exchanges", label: "3. Exchanges & Digital Store Credit" },
  { id: "damaged-items", label: "4. Damaged or Defective Items" },
  { id: "how-to", label: "5. How to Initiate an Alteration or Return" },
];

const strong = "text-ink font-medium";

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout
      title="Returns & Size Alterations"
      crumb="Returns & Alterations"
      intro="Our priority is ensuring your garment fits you comfortably. We offer free size adjustments on all made-to-order pieces."
      sections={sections}
      summary={{
        title: "Alteration Guarantee",
        items: [
          "7-Day window to report fit adjustments.",
          "Complimentary master tailor adjustments.",
          "Free doorstep reverse pickup across India.",
          "12-Month valid digital store credit for exchanges.",
        ],
        footer: (
          <Link
            href="/contact"
            className="flex items-center justify-center text-center min-h-12 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Request Alteration via Support
          </Link>
        ),
      }}
      links={{
        title: "Helpful Resources",
        items: [
          { href: "/faqs", label: "Sizing & Fit Guide FAQs" },
          { href: "/policies/shipping", label: "Shipping & Delivery Terms" },
        ],
      }}
    >
      <PolicySection id="made-to-order" title={sections[0].label}>
        <p>
          Each {BRAND.name} creation is handcrafted specifically for your order—cut, tailored, and hand-embroidered by master artisans in Jaipur. Because of this personalized craftsmanship and our zero-waste philosophy, we do not accept standard commercial returns or cash refunds for buyer&apos;s remorse.
        </p>
        <p>
          However, your satisfaction with the quality and fit of our work is sacred to us. We provide full fit guarantees through our dedicated alteration and exchange program.
        </p>
      </PolicySection>

      <PolicySection id="alterations" title={sections[1].label}>
        <p>If your garment requires slight fit refinements—such as sleeve shortening, waist tapering, or bust adjustments:</p>
        <div className={policyNote}>
          <p><strong className={strong}>One Round of Complimentary Adjustments:</strong> We provide one complimentary alteration within <strong className={strong}>7 days</strong> of delivery.</p>
          <p><strong className={strong}>Domestic Pickup:</strong> For clients within India, our courier will collect the garment from your doorstep at zero cost to you.</p>
          <p><strong className={strong}>Alteration Timeline:</strong> Our master tailors will refine the piece and re-dispatch it within 4 to 6 business days.</p>
        </div>
      </PolicySection>

      <PolicySection id="exchanges" title={sections[2].label}>
        <p>If an unworn garment cannot be tailored to your satisfaction or you wish to select another silhouette or colorway:</p>
        <ul className={policyList}>
          <li>You may request an exchange for <strong className={strong}>Digital Store Credit</strong> with a validity of 12 months.</li>
          <li>The request must be logged within <strong className={strong}>7 calendar days</strong> of parcel receipt.</li>
          <li>Items must be in pristine condition: unworn, unwashed, unaltered, free of perfumes or marks, with all original tags and security ribbons intact.</li>
          <li>Custom bridal wear with personal modifications requested by the customer is final sale and eligible for alterations only.</li>
        </ul>
      </PolicySection>

      <PolicySection id="damaged-items" title={sections[3].label}>
        <p>
          Every order undergoes a rigorous 14-point inspection prior to dispatch. However, in the improbable event that a garment arrives damaged or flawed:
        </p>
        <p>
          Please contact our customer support team within <strong className={strong}>48 hours</strong> of delivery with photographs of the parcel and defective area. Upon verification, we will provide an expedited recreation of your garment, or a full refund to your original payment method.
        </p>
      </PolicySection>

      <PolicySection id="how-to" title={sections[4].label}>
        <p>
          <strong className={strong}>Step 1:</strong> Navigate to your{" "}
          <Link href="/account/orders" className={`${policyLink} font-medium`}>Account Orders Dashboard</Link> and select the relevant order, or message our WhatsApp support (
          <a href="https://wa.me/919829014820" className={`${policyLink} font-medium`}>+91 98290 14820</a>).
        </p>
        <p><strong className={strong}>Step 2:</strong> State your alteration notes or fit feedback. Our master tailor will review your notes and confirm pickup.</p>
        <p><strong className={strong}>Step 3:</strong> Pack the garment securely into its original muslin pouch and gift box. Our courier will collect the package directly from your door.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
