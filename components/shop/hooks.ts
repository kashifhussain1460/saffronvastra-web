"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { buildShopSearch, parseShopQuery, ShopQuery } from "./shopData";

/**
 * Filters, sort, page and view live in the URL: links are shareable and back/forward restores them.
 * The history API is used directly (Next keeps useSearchParams in sync with it), so a filter change
 * is instant and does not ask the server to re-render the page.
 */
export function useShopQuery() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = useMemo(() => parseShopQuery(searchParams), [searchParams]);

  const setQuery = useCallback(
    (next: ShopQuery | ((q: ShopQuery) => ShopQuery), opts: { replace?: boolean } = {}) => {
      const current = parseShopQuery(new URLSearchParams(window.location.search));
      const value = typeof next === "function" ? next(current) : next;
      const url = `${pathname}${buildShopSearch(new URLSearchParams(window.location.search), value)}`;
      if (url === `${window.location.pathname}${window.location.search}`) return;
      if (opts.replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname]
  );

  return { query, setQuery };
}

export function useMediaQuery(q: string, initial = false) {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return match;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour shared by the filter drawer and quick view: Escape closes, body scroll is locked,
 * focus moves into the panel, Tab is kept inside it, and focus returns to the trigger on close.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const t = window.setTimeout(() => {
      const first = panel?.querySelector<HTMLElement>("[data-autofocus]") || panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first || panel)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [open]);

  return panelRef;
}
