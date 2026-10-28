"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  id?: string;
  size?: "md" | "sm";
}

/** Pill quantity stepper (Modave "wg-quantity"): never below `min`, never above `max`. */
export default function QuantitySelector({ value, onChange, min = 1, max, disabled, id = "pdp-quantity", size = "md" }: QuantitySelectorProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? Math.floor(n) : min));
  const h = size === "md" ? "h-12" : "h-11";
  return (
    <div className={`inline-flex ${h} w-[180px] max-w-full items-center justify-between rounded-full border-2 border-line bg-surface`}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:text-ink-muted disabled:opacity-60"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="w-12 border-0 bg-transparent p-0 text-center text-base font-medium text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:text-ink-muted disabled:opacity-60"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
