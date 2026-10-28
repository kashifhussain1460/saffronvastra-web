"use client";

import React, { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  /** Controlled state (pass with onToggle). */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** Classes for the header button (row height, type). */
  buttonClassName?: string;
  /** Classes for the panel's inner wrapper (indent, spacing). */
  panelClassName?: string;
  /** Classes for the outer wrapper (borders). */
  className?: string;
  /** Plus/minus icon size class. */
  iconClassName?: string;
}

/**
 * Modave accordion row: a full-width button with a plus that turns into a minus, and a panel that
 * slides open (grid-rows transition). The collapsed panel is `inert`, so its links are not tabbable.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  open: openProp,
  onToggle,
  buttonClassName = "flex w-full items-center justify-between gap-4 min-h-12 py-3 text-base font-semibold text-ink text-left",
  panelClassName = "",
  className = "",
  iconClassName = "w-4 h-4",
}: AccordionItemProps) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const id = useId();
  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setInner(next);
    onToggle?.(next);
  };
  return (
    <div className={className}>
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={`${id}-panel`} className={buttonClassName}>
        <span className="min-w-0">{title}</span>
        {open ? (
          <Minus aria-hidden="true" className={`${iconClassName} shrink-0`} />
        ) : (
          <Plus aria-hidden="true" className={`${iconClassName} shrink-0`} />
        )}
      </button>
      <div
        id={`${id}-panel`}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={panelClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default AccordionItem;
