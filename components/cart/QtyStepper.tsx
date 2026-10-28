"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

/** Modave pill quantity stepper: [-] n [+] inside a 2px rounded border. */
export default function QtyStepper({
  quantity,
  onDecrease,
  onIncrease,
  label,
  size = "md",
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Product name, read out with the current quantity. */
  label?: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-11 md:h-9" : "h-11 md:h-[42px]";
  return (
    <div
      role="group"
      aria-label={label ? `Quantity for ${label}` : "Quantity"}
      className={`inline-flex items-center ${h} border-2 border-line rounded-full bg-surface`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="h-full w-11 md:w-9 grid place-items-center rounded-full text-ink hover:text-primary-hover disabled:text-ink-muted disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span aria-live="polite" className="min-w-8 text-center text-base font-medium text-ink tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="h-full w-11 md:w-9 grid place-items-center rounded-full text-ink hover:text-primary-hover transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
