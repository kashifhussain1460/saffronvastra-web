"use client";

import React from "react";
import type { ProductColor, Size } from "@/types";

export interface PdpVariant {
  id: string;
  sku?: string | null;
  size: string;
  colourName?: string | null;
  colourHex?: string | null;
  status?: string | null;
}

interface VariantSelectorProps {
  colors: ProductColor[];
  sizes: Size[];
  variants: PdpVariant[];
  selectedColor: ProductColor | null;
  selectedSize: Size | null;
  onColorChange: (c: ProductColor) => void;
  onSizeChange: (s: Size) => void;
  onOpenSizeGuide: () => void;
  sizeError?: string;
  colorError?: string;
  sizeGroupRef?: React.RefObject<HTMLDivElement | null>;
  colorGroupRef?: React.RefObject<HTMLDivElement | null>;
}

const isActive = (v: PdpVariant) => !v.status || v.status === "Active";

/** True when an active variant exists for this size (and colour, when one is chosen). */
export function sizeAvailable(variants: PdpVariant[], size: string, colorName?: string | null) {
  if (variants.length === 0) return true; // nothing to check against: the cart API validates
  return variants.some((v) => v.size === size && isActive(v) && (!colorName || (v.colourName || "Standard") === colorName));
}

export function colorAvailable(variants: PdpVariant[], colorName: string) {
  if (variants.length === 0) return true;
  return variants.some((v) => (v.colourName || "Standard") === colorName && isActive(v));
}

export default function VariantSelector({
  colors,
  sizes,
  variants,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onOpenSizeGuide,
  sizeError,
  colorError,
  sizeGroupRef,
  colorGroupRef,
}: VariantSelectorProps) {
  return (
    <div className="space-y-5">
      {/* Colour */}
      <div ref={colorGroupRef} tabIndex={-1} className="space-y-2.5 focus:outline-none">
        <p className="text-base text-ink" id="pdp-colour-label">
          Colour:{" "}
          <span className="font-medium" data-testid="pdp-selected-colour">
            {selectedColor ? selectedColor.name : <span className="text-ink-muted font-normal">Please choose</span>}
          </span>
        </p>
        <div role="group" aria-labelledby="pdp-colour-label" className="flex flex-wrap items-center gap-2.5">
          {colors.map((color) => {
            const active = selectedColor?.name === color.name;
            const available = colorAvailable(variants, color.name);
            return (
              <button
                key={color.name}
                type="button"
                aria-pressed={active}
                disabled={!available}
                onClick={() => onColorChange(color)}
                title={color.name}
                aria-label={`Select color ${color.name}`}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active ? "border-primary" : "border-transparent hover:border-line-strong"
                }`}
              >
                <span className="block h-8 w-8 rounded-full border border-line" style={{ backgroundColor: color.hex }} />
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-inverse px-2 py-0.5 text-xs text-on-inverse group-hover:block">
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
        {colorError && (
          <p role="alert" className="text-sm text-error">
            {colorError}
          </p>
        )}
      </div>

      {/* Size */}
      <div ref={sizeGroupRef} tabIndex={-1} className="space-y-2.5 focus:outline-none">
        <div className="flex items-center justify-between gap-4">
          <p className="text-base text-ink" id="pdp-size-label">
            Size:{" "}
            <span className="font-medium" data-testid="pdp-selected-size">
              {selectedSize ?? <span className="text-ink-muted font-normal">Please choose</span>}
            </span>
          </p>
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-base text-ink underline underline-offset-4 transition-colors hover:text-primary-hover"
          >
            Size Guide
          </button>
        </div>
        <div role="group" aria-labelledby="pdp-size-label" className="flex flex-wrap gap-2.5">
          {sizes.map((size) => {
            const active = selectedSize === size;
            const available = sizeAvailable(variants, size, selectedColor?.name);
            const wide = size.length > 2;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={active}
                aria-label={size}
                disabled={!available}
                onClick={() => onSizeChange(size)}
                title={available ? undefined : `${size} is not available`}
                className={`flex h-12 items-center justify-center rounded-full border-2 text-base font-medium transition-colors ${
                  wide ? "min-w-12 px-5" : "w-12"
                } ${
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : available
                      ? "border-line bg-surface text-ink hover:border-primary"
                      : "cursor-not-allowed border-surface-muted bg-surface-muted text-ink-muted line-through"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        {sizeError && (
          <p role="alert" className="text-sm text-error">
            {sizeError}
          </p>
        )}
      </div>
    </div>
  );
}
