"use client";

import { BRAND } from "@/lib/brand";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Ruler } from "lucide-react";
import MeasurementsTable from "./MeasurementsTable";
import { measurementRows, STANDARD_JACKET, type ProductMeasurements } from "@/lib/sizeChart";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  // this product's garment measurements (from the admin); the standard chart is shown when there are none
  measurements?: ProductMeasurements | null;
  // the size currently selected on the product page, highlighted in the table
  selectedSize?: string | null;
}

export default function SizeGuideModal({ isOpen, onClose, measurements, selectedSize }: SizeGuideModalProps) {
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

  const own = measurementRows(measurements);
  const rows = own.length ? own : STANDARD_JACKET.rows;
  const note = own.length ? measurements?.note : STANDARD_JACKET.note;

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
            {BRAND.displayName} Unisex Size Guide
          </h2>
        </div>
        <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
          Our jackets and kimonos feature a relaxed, versatile unisex fit designed to look effortless on all genders. Measure yourself around the fullest points for your ideal fit.
        </p>

        <MeasurementsTable
          rows={rows}
          caption={own.length ? "Measurements for this piece" : "Standard unisex garment measurements"}
          note={note}
          highlightSize={selectedSize}
        />
        <p className="mt-3 text-xs text-ink-secondary">
          Pick the size whose &quot;Fits chest&quot; range includes your body chest measurement.{" "}
          <Link href="/size-guide" className="underline underline-offset-2 text-ink hover:text-primary-hover">
            How to measure
          </Link>
        </p>

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
