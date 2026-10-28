"use client";

import React from "react";
import { X } from "lucide-react";
import { useDialog } from "./hooks";

/** Modave off-canvas filter ("canvas-filter"): slides in from the left, 320px (400px from md). */
export default function MobileFilterDrawer({
  open,
  onClose,
  onReset,
  resultCount,
  children,
  id,
}: {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  resultCount: number;
  children: React.ReactNode;
  id: string;
}) {
  const panelRef = useDialog(open, onClose);
  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        inert={!open}
        className={`absolute inset-y-0 left-0 flex w-[320px] max-w-[88vw] flex-col bg-canvas shadow-drawer outline-none transition-transform duration-300 md:w-[400px] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[52px] shrink-0 items-center justify-between bg-surface-muted px-5">
          <h2 id={`${id}-title`} className="text-lg font-medium text-ink">
            Filters
          </h2>
          <button type="button" onClick={onClose} aria-label="Close filters" className="-mr-2 grid h-11 w-11 place-items-center text-ink hover:text-primary-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">{open ? children : null}</div>
        <div className="grid shrink-0 grid-cols-2 gap-2.5 border-t border-line bg-canvas px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onReset}
            className="h-12 rounded-full border border-primary text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-primary hover:text-on-primary"
          >
            Reset filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full bg-primary text-xs font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-hover"
          >
            {`Show ${resultCount}`}
          </button>
        </div>
      </div>
    </div>
  );
}
