"use client";

import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/** One filter group (Modave "widget-facet"): title row that collapses its content, divider below. */
export default function FilterAccordion({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-b border-line pb-6 pt-5 first:pt-0 last:border-b-0 xl:pb-8">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left text-lg font-medium text-ink xl:min-h-0 xl:text-xl"
        >
          {title}
          <ChevronDown className={`h-4 w-4 shrink-0 text-ink-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} hidden={!open} className="pt-3 xl:pt-4">
        {children}
      </div>
    </section>
  );
}
