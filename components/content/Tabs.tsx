"use client";

import React, { useId, useRef, useState } from "react";

export interface TabEntry {
  id: string;
  label: string;
  content: React.ReactNode;
}

/** Modave underline tabs (about page). WAI-ARIA tabs: arrow keys, Home and End move between tabs. */
export default function Tabs({ tabs, label }: { tabs: TabEntry[]; label: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    setActive(n);
    refs.current[n]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight") move(i + 1);
    else if (e.key === "ArrowLeft") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(tabs.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-x-6 gap-y-1 border-b border-line">
        {tabs.map((t, i) => {
          const selected = i === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-${t.id}-tab`}
              aria-selected={selected}
              aria-controls={`${base}-${t.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px min-h-11 border-b-2 text-base font-medium transition-colors ${
                selected ? "border-ink text-secondary" : "border-transparent text-ink hover:text-primary-hover"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-${t.id}-panel`}
          aria-labelledby={`${base}-${t.id}-tab`}
          hidden={i !== active}
          tabIndex={0}
          className="pt-5 md:pt-6 space-y-4 text-base leading-[26px] text-ink"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
