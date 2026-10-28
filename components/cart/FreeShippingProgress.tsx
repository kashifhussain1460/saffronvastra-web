import React from "react";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Modave "Buy X more to get free shipping" line with a progress track and knob. Uses the shop's real threshold. */
export default function FreeShippingProgress({ cartTotal, threshold }: { cartTotal: number; threshold: number }) {
  if (!threshold || threshold <= 0) return null;
  const pct = Math.min(100, Math.round((cartTotal / threshold) * 100));
  const remaining = Math.max(0, threshold - cartTotal);
  return (
    <div>
      <p className="text-base text-ink">
        {remaining > 0 ? (
          <>
            Buy <span className="font-semibold text-secondary">{inr(remaining)}</span> more to get{" "}
            <strong className="font-semibold">Free shipping</strong>
          </>
        ) : (
          <>
            You have unlocked <strong className="font-semibold">Free shipping</strong>
          </>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Progress towards free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative mt-3 h-1 rounded-full bg-line"
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-success transition-[width] duration-500" style={{ width: `${pct}%` }} />
        <span
          aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-success transition-[left] duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
