"use client";

import React from "react";
import { Banknote, CreditCard, AlertCircle } from "lucide-react";

export type PaymentChoice = "COD" | "CASHFREE";

interface Props {
  value: PaymentChoice;
  onChange: (next: PaymentChoice) => void;
  codEnabled: boolean;
  onlineEnabled: boolean;
  /** Cash on Delivery handling fee in rupees (0 = none). */
  codFee: number;
  disabled?: boolean;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** "Payment method" radio group: Cash on Delivery and/or pay online, depending on what the shop has switched on. */
export default function PaymentMethodPicker({ value, onChange, codEnabled, onlineEnabled, codFee, disabled }: Props) {
  const options = [
    {
      id: "COD" as const,
      enabled: codEnabled,
      icon: Banknote,
      title: "Cash on Delivery",
      text:
        codFee > 0
          ? `Pay in cash when your order is delivered. A Cash on Delivery handling fee of ${inr(codFee)} applies.`
          : "Pay in cash when your order is delivered. There is nothing to pay online and no extra fee.",
    },
    {
      id: "CASHFREE" as const,
      enabled: onlineEnabled,
      icon: CreditCard,
      title: "Pay online",
      text: "UPI, cards, net banking and wallets as enabled by the payment provider. Secure payment through Cashfree.",
    },
  ].filter((o) => o.enabled);

  return (
    <fieldset disabled={disabled} data-testid="payment-method">
      <legend className="text-2xl font-medium text-ink mb-5">Payment method</legend>
      {options.length === 0 ? (
        <p role="alert" className="p-4 bg-warning-bg border border-warning-line text-warning text-sm rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>No payment method is available right now. Please try again shortly or contact us for help placing your order.</span>
        </p>
      ) : (
        <div className="space-y-3">
          {options.map((opt) => {
            const active = value === opt.id;
            const Icon = opt.icon;
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-4 min-h-[44px] rounded-xl border-2 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 ${
                  active ? "border-ink bg-surface-muted" : "border-line hover:border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.id}
                  checked={active}
                  onChange={() => onChange(opt.id)}
                  className="mt-1 w-4 h-4 accent-primary shrink-0"
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-base font-medium text-ink">
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {opt.title}
                  </span>
                  <span className="block text-sm text-ink-secondary mt-1 leading-relaxed">{opt.text}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
