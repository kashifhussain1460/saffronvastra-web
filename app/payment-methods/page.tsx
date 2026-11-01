import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import PolicyLayout, { PolicySection, policyList, policyNote } from "@/components/content/PolicyLayout";

export const metadata = {
  title: `Payment Methods | ${BRAND.displayName}`,
  description:
    `Secure payment options supported by ${BRAND.displayName}, including UPI, Debit/Credit Cards, Net Banking via Cashfree, and Cash on Delivery.`,
};

const sections = [
  { id: "online-payments", label: "1. Online Payment Options (Powered by Cashfree)" },
  { id: "upi", label: "2. UPI Payments (Instant & Zero Fee)" },
  { id: "cards-netbanking", label: "3. Debit Cards, Credit Cards & Net Banking" },
  { id: "cash-on-delivery", label: "4. Cash on Delivery (COD)" },
  { id: "security", label: "5. Payment Security & Encryption" },
  { id: "failed-payments", label: "6. Failed or Deducted Payment Resolution" },
];

const strong = "text-ink font-medium";

export default function PaymentMethodsPage() {
  return (
    <PolicyLayout
      title="Payment Methods"
      crumb="Payment Methods"
      intro={`At ${BRAND.displayName}, we provide secure, seamless, and convenient payment options for domestic shoppers across India.`}
      sections={sections}
      summary={{
        title: "Accepted Payments",
        items: [
          "UPI: Google Pay, PhonePe, Paytm, BHIM & all UPI apps",
          "Cards: Visa, MasterCard, RuPay debit & credit cards",
          "Net Banking: 50+ major Indian banks supported",
          "Cash on Delivery (COD): available for serviceable Indian PIN codes",
          "Security: 256-bit encrypted checkout via Cashfree Payments",
        ],
        footer: (
          <div className="space-y-2">
            <p className="text-sm text-ink-secondary">Have questions regarding a payment transaction?</p>
            <Link href="/contact" className="inline-flex items-center min-h-11 text-sm font-semibold text-ink underline underline-offset-4 hover:text-primary-hover">
              Contact Support
            </Link>
          </div>
        ),
      }}
      links={{
        title: "Related Information",
        items: [
          { href: "/policies/shipping", label: "Shipping & Delivery Policy" },
          { href: "/policies/returns", label: "Returns, Exchanges & Cancellations" },
          { href: "/order-cancellation", label: "Order Cancellation Policy" },
          { href: "/policies/terms", label: "Terms & Conditions" },
        ],
      }}
    >
      <PolicySection id="online-payments" title={sections[0].label}>
        <p>
          We partner with <strong className={strong}>Cashfree Payments</strong>, an RBI-authorized payment gateway, to ensure every transaction is fast, protected, and encrypted. All prices on our store are listed in Indian Rupees (₹ INR).
        </p>
      </PolicySection>

      <PolicySection id="upi" title={sections[1].label}>
        <p>
          UPI is the fastest and most convenient method to complete your purchase:
        </p>
        <ul className={policyList}>
          <li>Supported apps include <strong className={strong}>Google Pay, PhonePe, Paytm, BHIM</strong>, and all bank UPI applications.</li>
          <li>Pay via instant app intent on mobile or scan the dynamic dynamic QR code on desktop.</li>
          <li>Instant confirmation with zero processing surcharge.</li>
        </ul>
      </PolicySection>

      <PolicySection id="cards-netbanking" title={sections[2].label}>
        <p>
          We support all major Indian debit and credit cards as well as net banking:
        </p>
        <ul className={policyList}>
          <li><strong className={strong}>Cards:</strong> Visa, MasterCard, and RuPay (Debit &amp; Credit).</li>
          <li><strong className={strong}>Two-Factor Authentication:</strong> Protected by mandatory OTP verification from your issuing bank.</li>
          <li><strong className={strong}>Net Banking:</strong> Direct online banking across SBI, HDFC, ICICI, Axis, Kotak, and 50+ other Indian banks.</li>
        </ul>
      </PolicySection>

      <PolicySection id="cash-on-delivery" title={sections[3].label}>
        <p>
          We offer Cash on Delivery (COD) for eligible domestic orders:
        </p>
        <div className={policyNote}>
          <p><strong className={strong}>PIN Code Verification:</strong> COD availability is verified automatically based on your 6-digit delivery PIN code at checkout.</p>
          <p><strong className={strong}>Exact Cash:</strong> Please keep the exact cash amount ready at the time of delivery to ensure a smooth handover with our courier partner.</p>
          <p><strong className={strong}>Order Confirmation:</strong> COD orders may receive an automated WhatsApp or telephonic verification prior to dispatch.</p>
        </div>
      </PolicySection>

      <PolicySection id="security" title={sections[4].label}>
        <p>
          Your financial security is our utmost priority:
        </p>
        <ul className={policyList}>
          <li>All online transactions are encrypted via 256-bit SSL protocols.</li>
          <li>{BRAND.displayName} does not store your card number, CVV, or banking passwords on our servers.</li>
          <li>All payment processing adheres strictly to PCI-DSS Level 1 compliance standards.</li>
        </ul>
      </PolicySection>

      <PolicySection id="failed-payments" title={sections[5].label}>
        <p>
          If money has been deducted from your account but the order status shows pending or failed:
        </p>
        <p>
          Please allow a few minutes for the bank and gateway to synchronize. If the transaction was not confirmed, the deducted amount is automatically refunded by your issuing bank within 3 to 5 business days. You may also contact our support team at <a href={`mailto:${BRAND.supportEmail}`} className="underline text-ink font-medium">{BRAND.supportEmail}</a> or WhatsApp us at <strong className={strong}>{BRAND.phone}</strong> with your transaction reference.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}

