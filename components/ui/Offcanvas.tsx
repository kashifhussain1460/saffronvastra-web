"use client";

import React, { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------------------------------------
 * Shared overlay behaviour for drawers and modals (Modave off-canvas / modal pattern):
 * - usePresence: keeps the overlay mounted while its exit transition runs
 * - useScrollLock: locks body scroll (reference-counted so stacked overlays do not unlock early)
 * - useDialogFocus: moves focus in, traps Tab inside, restores focus to the trigger on close
 * - useEscape: closes on Escape
 * - <Offcanvas>: left/right drawer with backdrop, built on the hooks above
 * ---------------------------------------------------------------------------------------------- */

export function usePresence(open: boolean, duration = 300) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // next frame so the enter transition runs from the closed state
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), duration);
    return () => clearTimeout(t);
  }, [open, duration]);
  return { mounted, visible };
}

let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      const body = document.body;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      savedOverflow = body.style.overflow;
      savedPaddingRight = body.style.paddingRight;
      body.style.overflow = "hidden";
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    }
    lockCount += 1;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = savedOverflow;
        document.body.style.paddingRight = savedPaddingRight;
      }
    };
  }, [active]);
}

export function useEscape(active: boolean, onEscape: () => void) {
  const cb = useRef(onEscape);
  cb.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cb.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0
  );
}

/** Focus moves into `panelRef` when `active` turns on, Tab stays inside, focus returns to the trigger on close. */
export function useDialogFocus(
  active: boolean,
  panelRef: React.RefObject<HTMLElement | null>,
  initialFocusRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!active) return;
    const trigger = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = initialFocusRef?.current || focusables(panel)[0] || panel;
      target.focus({ preventScroll: true });
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = focusables(panel);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (!current || !panel.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
    };
  }, [active, panelRef, initialFocusRef]);
}

interface OffcanvasProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  side?: "left" | "right";
  /** Width/direction classes for the sliding panel (a flex container; default: Modave mobile menu width, column). */
  panelClassName?: string;
  /** Element to focus first (defaults to the first focusable element in the panel). */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Extra classes for the fixed wrapper, e.g. "xl:hidden" for a mobile-only drawer. */
  className?: string;
  children: React.ReactNode;
}

/** Modave off-canvas: fixed panel sliding in from the side over a 20% ink backdrop. */
export default function Offcanvas({
  open,
  onClose,
  label,
  side = "left",
  panelClassName = "w-[320px] max-w-[85vw] flex-col",
  initialFocusRef,
  className = "",
  children,
}: OffcanvasProps) {
  const { mounted, visible } = usePresence(open);
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useEscape(open, onClose);
  useDialogFocus(open, panelRef, initialFocusRef);

  if (!mounted) return null;

  const hiddenTransform = side === "left" ? "-translate-x-full" : "translate-x-full";
  return (
    <div className={`fixed inset-0 z-50 ${className}`} role="dialog" aria-modal="true" aria-label={label}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/20 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"} flex bg-canvas outline-none transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : hiddenTransform
        } ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
