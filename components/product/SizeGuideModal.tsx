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
    { size: "S", bustIn: "34 - 36", waistIn: "28 - 30", hipIn: "36 - 38", lengthIn: "27", bustCm: "86 - 91", waistCm: "71 - 76", hipCm: "91 - 96", lengthCm: "68" },
    { size: "M", bustIn: "36 - 38", waistIn: "30 - 32", hipIn: "38 - 40", lengthIn: "27.5", bustCm: "91 - 96", waistCm: "76 - 81", hipCm: "96 - 101", lengthCm: "70" },
    { size: "L", bustIn: "38 - 40", waistIn: "32 - 34", hipIn: "40 - 42", lengthIn: "28", bustCm: "96 - 101", waistCm: "81 - 86", hipCm: "101 - 106", lengthCm: "71" },
    { size: "XL", bustIn: "40 - 43", waistIn: "34 - 37", hipIn: "42 - 45", lengthIn: "28.5", bustCm: "101 - 109", waistCm: "86 - 94", hipCm: "106 - 114", lengthCm: "72" },
    { size: "Free Size", bustIn: "34 - 42", waistIn: "28 - 36", hipIn: "36 - 44", lengthIn: "28", bustCm: "86 - 106", waistCm: "71 - 91", hipCm: "91 - 112", lengthCm: "71" },
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
            {BRAND.name} Size Guide
          </h2>
        </div>
        <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
          Our garments are crafted to order with a contemporary relaxed fit. Measure yourself around the fullest points for the ideal fit.
        </p>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
          <span className="text-sm font-medium text-ink">
            Garment Measurements
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
                <th className="py-2.5 font-medium">Bust</th>
                <th className="py-2.5 font-medium">Waist</th>
                <th className="py-2.5 font-medium">Hip</th>
                <th className="py-2.5 font-medium">Jacket Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-sans text-ink">
              {sizeData.map((row) => (
                <tr key={row.size} className="hover:bg-surface-muted">
                  <td className="py-3 font-medium text-ink">{row.size}</td>
                  <td className="py-3">{unit === "inches" ? row.bustIn : row.bustCm}</td>
                  <td className="py-3">{unit === "inches" ? row.waistIn : row.waistCm}</td>
                  <td className="py-3">{unit === "inches" ? row.hipIn : row.hipCm}</td>
                  <td className="py-3">{unit === "inches" ? row.lengthIn : row.lengthCm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custom Tailoring Note */}
        <div className="mt-6 p-4 bg-surface-muted rounded-lg text-sm text-ink-secondary space-y-1">
          <p className="font-medium text-ink">Need Custom Sizing?</p>
          <p className="leading-relaxed text-sm text-ink-secondary">
            Because our clothing is made to order by skilled artisans, custom shoulder, sleeve, or length adjustments can be accommodated upon request at checkout.
          </p>
        </div>

      </div>
    </div>
  );
}
