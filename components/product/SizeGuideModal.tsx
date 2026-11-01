"use client";

import { BRAND } from "@/lib/brand";
import React, { useState, useEffect, useRef } from "react";
import { X, Ruler } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<"inches" | "cm">("inches");

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, Tab stays inside, focus moves in and back to the trigger, page scroll is locked
  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = [...panelRef.current.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeData = [
    { size: "XS", chestIn: "32 - 34", waistIn: "26 - 28", hipIn: "34 - 36", lengthIn: "26.5", chestCm: "81 - 86", waistCm: "66 - 71", hipCm: "86 - 91", lengthCm: "67" },
    { size: "S", chestIn: "35 - 37", waistIn: "29 - 31", hipIn: "37 - 39", lengthIn: "27", chestCm: "89 - 94", waistCm: "73 - 79", hipCm: "94 - 99", lengthCm: "69" },
    { size: "M", chestIn: "38 - 40", waistIn: "32 - 34", hipIn: "40 - 42", lengthIn: "27.5", chestCm: "96 - 101", waistCm: "81 - 86", hipCm: "101 - 107", lengthCm: "70" },
    { size: "L", chestIn: "41 - 43", waistIn: "35 - 37", hipIn: "43 - 45", lengthIn: "28", chestCm: "104 - 109", waistCm: "89 - 94", hipCm: "109 - 114", lengthCm: "71" },
    { size: "XL", chestIn: "44 - 46", waistIn: "38 - 40", hipIn: "46 - 48", lengthIn: "28.5", chestCm: "112 - 117", waistCm: "96 - 101", hipCm: "117 - 122", lengthCm: "72" },
    { size: "XXL", chestIn: "47 - 50", waistIn: "41 - 44", hipIn: "49 - 52", lengthIn: "29", chestCm: "119 - 127", waistCm: "104 - 112", hipCm: "124 - 132", lengthCm: "74" },
    { size: "Free Size", chestIn: "36 - 44", waistIn: "30 - 38", hipIn: "38 - 46", lengthIn: "28", chestCm: "91 - 112", waistCm: "76 - 96", hipCm: "96 - 117", lengthCm: "71" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-ink/40 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Size Guide"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={panelRef} className="relative w-full md:max-w-[640px] bg-surface rounded-t-2xl md:rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto p-5 pt-14 sm:p-8 sm:pt-14 md:p-10 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] animate-in slide-in-from-bottom md:slide-in-from-bottom-0">
        
        {/* Close Button */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 w-11 h-11 rounded-full bg-surface-muted flex items-center justify-center text-ink transition-colors hover:bg-primary hover:text-on-primary"
          aria-label="Close size guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <Ruler className="w-5 h-5 text-ink" />
          <h2 className="text-xl md:text-2xl text-ink font-medium">
            {BRAND.name} Unisex Size Guide
          </h2>
        </div>
        <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
          Our jackets and kimonos feature a relaxed, versatile unisex fit designed to look effortless on all genders. Measure yourself around the fullest points for your ideal fit.
        </p>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
          <span className="text-sm font-medium text-ink">
            Unisex Garment Measurements
          </span>
          <div className="inline-flex border border-line rounded-lg bg-surface p-1" role="group" aria-label="Units">
            <button
              type="button"
              aria-pressed={unit === "inches"}
              onClick={() => setUnit("inches")}
              className={`rounded-md px-4 min-h-9 text-sm font-medium transition-colors ${
                unit === "inches"
                  ? "bg-surface-muted text-ink"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Inches
            </button>
            <button
              type="button"
              aria-pressed={unit === "cm"}
              onClick={() => setUnit("cm")}
              className={`rounded-md px-4 min-h-9 text-sm font-medium transition-colors ${
                unit === "cm"
                  ? "bg-surface-muted text-ink"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink text-sm">
                <th className="py-2.5 font-medium">Size</th>
                <th className="py-2.5 font-medium">Chest / Bust</th>
                <th className="py-2.5 font-medium">Waist</th>
                <th className="py-2.5 font-medium">Hip</th>
                <th className="py-2.5 font-medium">Jacket Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-sans text-ink">
              {sizeData.map((row) => (
                <tr key={row.size} className="hover:bg-surface-muted">
                  <td className="py-3 font-medium text-ink">{row.size}</td>
                  <td className="py-3">{unit === "inches" ? row.chestIn : row.chestCm}</td>
                  <td className="py-3">{unit === "inches" ? row.waistIn : row.waistCm}</td>
                  <td className="py-3">{unit === "inches" ? row.hipIn : row.hipCm}</td>
                  <td className="py-3">{unit === "inches" ? row.lengthIn : row.lengthCm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custom Tailoring & Fit Note */}
        <div className="mt-6 p-4 bg-surface-muted rounded-lg text-sm text-ink-secondary space-y-2">
          <div>
            <p className="font-medium text-ink text-xs uppercase tracking-wider">Unisex Fit Advice</p>
            <p className="text-xs text-ink-secondary mt-0.5">
              Men typically fit true-to-size. Women looking for a closer tailored fit may select one size down, or stay true-to-size for an effortless relaxed drape.
            </p>
          </div>
          <div className="pt-2 border-t border-line/60">
            <p className="font-medium text-ink">Need Custom Sizing?</p>
            <p className="leading-relaxed text-xs text-ink-secondary">
              Because our pieces are made to order, custom sleeve length, shoulder width, or body length can be requested at checkout at no extra charge.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
