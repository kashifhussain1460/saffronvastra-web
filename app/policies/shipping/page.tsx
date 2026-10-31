import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PolicyLayout, { PolicySection, policyList, policyNote } from "@/components/content/PolicyLayout";

export const metadata = {
  title: `Shipping & Delivery Policy | ${BRAND.name}`,
  description:
    `Worldwide shipping terms, made-to-order production lead times, and insured courier details for ${BRAND.name}.`,
};

const sections = [
  { id: "made-to-order-timeline", label: "1. The Made-to-Order Production Timeline" },
  { id: "domestic-shipping", label: "2. Domestic Shipping within India" },
  { id: "international-shipping", label: "3. International Express Shipping" },
  { id: "customs-duties", label: "4. Customs, Duties & Import Tariffs" },
  { id: "packaging", label: "5. Heirloom Keepsake Packaging" },
  { id: "tracking", label: "6. Real-Time Consignment Tracking" },
];

const strong = "text-ink font-medium";

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping & Delivery Policy"
      crumb="Shipping & Delivery"
      intro={`Every ${BRAND.name} creation is individually tailored in Jaipur and transported across the globe via white-glove insured courier.`}
      sections={sections}
      summary={{
        title: "At a Glance",
        items: [
          "5–7 Business Days: handcrafted made-to-order production",
          "100% Insured Delivery: full coverage for peace of mind",
          "Free Shipping Worldwide: on orders above ₹15,000 / $150 USD",
          "Luxury Keepsake Box: muslin storage pouch & monogram box",
        ],
        footer: (
          <div className="space-y-2">
            <p className="text-sm text-ink-secondary">Have an urgent wedding date or international travel schedule?</p>
            <Link href="/contact" className="inline-flex items-center min-h-11 text-sm font-semibold text-ink underline underline-offset-4 hover:text-primary-hover">
              Contact Customer Support
            </Link>
          </div>
        ),
      }}
      links={{
        title: "Explore Other Policies",
        items: [
          { href: "/policies/returns", label: "Returns & Size Alterations" },
          { href: "/policies/privacy", label: "Privacy & Data Protection" },
          { href: "/policies/terms", label: "Terms of Service" },
        ],
      }}
    >
      <PolicySection id="made-to-order-timeline" title={sections[0].label}>
        <p>
          Unlike conventional off-the-rack retailers, {BRAND.name} does not maintain pre-manufactured inventory. Every jacket, kimono, and ensemble is cut, framed onto traditional wooden Karchob looms, and hand-embroidered by master artisans in Jaipur exclusively upon order placement.
        </p>
        <div className={policyNote}>
          <p><strong className={strong}>Standard Tailoring Lead Time:</strong> 5 to 7 business days from date of payment confirmation.</p>
          <p><strong className={strong}>Urgent Orders:</strong> If you require delivery by a specific event or wedding date, please notify our customer support team prior to or immediately following order placement.</p>
        </div>
      </PolicySection>

      <PolicySection id="domestic-shipping" title={sections[1].label}>
        <p>
          We provide <strong className={strong}>Complimentary Insured Express Delivery</strong> on all domestic orders within India, with no minimum cart requirement.
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Logistics Partners:</strong> BlueDart Express, Delhivery, and DTDC Air Courier.</li>
          <li><strong className={strong}>Transit Time:</strong> 2 to 3 business days post-dispatch across major metros (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata). 3 to 5 days for tier-2/3 cities.</li>
          <li><strong className={strong}>Delivery Confirmation:</strong> All domestic parcels require a recipient signature or OTP verification upon handover.</li>
        </ul>
      </PolicySection>

      <PolicySection id="international-shipping" title={sections[2].label}>
        <p>
          We ship to over 45 countries worldwide via <strong className={strong}>DHL Express Worldwide</strong>.
        </p>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-surface-muted text-ink">
              <tr>
                <th scope="col" className="p-3 md:p-4 font-medium">Destination</th>
                <th scope="col" className="p-3 md:p-4 font-medium">Transit Time (Post-Production)</th>
                <th scope="col" className="p-3 md:p-4 font-medium">Shipping Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="p-3 md:p-4 text-ink font-medium">Orders Above ₹15,000 (~$150 USD)</td>
                <td className="p-3 md:p-4">3 – 5 Business Days</td>
                <td className="p-3 md:p-4 font-semibold text-success">COMPLIMENTARY</td>
              </tr>
              <tr>
                <td className="p-3 md:p-4">United States, UK &amp; Europe</td>
                <td className="p-3 md:p-4">3 – 5 Business Days</td>
                <td className="p-3 md:p-4">₹2,500 (~$30 USD)</td>
              </tr>
              <tr>
                <td className="p-3 md:p-4">UAE, GCC &amp; Middle East</td>
                <td className="p-3 md:p-4">2 – 4 Business Days</td>
                <td className="p-3 md:p-4">₹2,200 (~$26 USD)</td>
              </tr>
              <tr>
                <td className="p-3 md:p-4">Australia, Canada &amp; Singapore</td>
                <td className="p-3 md:p-4">4 – 6 Business Days</td>
                <td className="p-3 md:p-4">₹2,800 (~$34 USD)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PolicySection>

      <PolicySection id="customs-duties" title={sections[3].label}>
        <p>
          All international shipments are dispatched on a <strong className={strong}>Delivery Duty Unpaid (DDU)</strong> basis. The displayed merchandise prices do not include international import duties, tariffs, or clearance handling fees that may be assessed by customs authorities in your destination country.
        </p>
        <p>
          Any applicable charges are the sole responsibility of the client and will be collected directly by DHL prior to or at the time of delivery.
        </p>
      </PolicySection>

      <PolicySection id="packaging" title={sections[4].label}>
        <p>
          Each handcrafted piece is folded into an unbleached, breathable organic cotton muslin storage bag and encased in our rigid botanical monogram keepsake box. A signed certificate of authenticity and handwritten artisan note accompany every shipment.
        </p>
      </PolicySection>

      <PolicySection id="tracking" title={sections[5].label}>
        <p>
          As soon as your garment passes inspection and is scanned by our courier, you will receive an SMS and email notification with your tracking AWB number. You can also view step-by-step progress at any time within your account dashboard.
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
