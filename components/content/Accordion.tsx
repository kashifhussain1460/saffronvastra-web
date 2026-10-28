"use client";

import React, { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface AccordionEntry {
  id: string;
  question: string;
  answer: React.ReactNode;
}

/**
 * Modave-style FAQ accordion: a heading holding a real button (aria-expanded / aria-controls) per item,
 * hairline rule underneath, plus/minus indicator. Several items may be open at once.
 */
export default function Accordion({
  items,
  defaultOpen = [],
  headingLevel = 3,
}: {
  items: AccordionEntry[];
  defaultOpen?: string[];
  headingLevel?: 2 | 3 | 4;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen));
  const base = useId();
  const Heading = `h${headingLevel}` as "h3";

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="border-t border-line md:border-t-0">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const btnId = `${base}-${item.id}-btn`;
        const panelId = `${base}-${item.id}-panel`;
        return (
          <div key={item.id} className="border-b border-line" data-faq-item={item.id}>
            <Heading className="m-0">
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between gap-4 py-3 md:py-5 min-h-[48px] text-left text-base leading-6 md:text-xl md:leading-7 font-medium text-ink hover:text-primary-hover transition-colors"
              >
                <span>{item.question}</span>
                {isOpen ? (
                  <Minus aria-hidden="true" className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                ) : (
                  <Plus aria-hidden="true" className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                )}
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="pb-4 md:pb-5 -mt-1 text-sm md:text-base leading-[26px] text-ink-secondary max-w-[48rem]"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
