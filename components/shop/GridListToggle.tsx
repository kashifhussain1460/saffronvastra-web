"use client";

import React from "react";
import { ViewMode } from "./shopData";

// Simple dot glyphs in the spirit of Modave's layout switch (drawn here, not copied).
function Dots({ cols, filled }: { cols: number; filled: boolean }) {
  const w = cols * 8 - 2;
  return (
    <svg width={w} height="20" viewBox={`0 0 ${w} 20`} fill="none" aria-hidden="true">
      {[6, 14].flatMap((cy) =>
        Array.from({ length: cols }, (_, i) => (
          <circle key={`${cy}-${i}`} cx={3 + i * 8} cy={cy} r="2.5" stroke="currentColor" fill={filled ? "currentColor" : "none"} />
        ))
      )}
    </svg>
  );
}

function ListGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {[6, 14].map((cy) => (
        <g key={cy}>
          <circle cx="3" cy={cy} r="2.5" stroke="currentColor" fill={filled ? "currentColor" : "none"} />
          <rect x="7.5" y={cy - 2.5} width="12" height="5" rx="2.5" stroke="currentColor" fill={filled ? "currentColor" : "none"} />
        </g>
      ))}
    </svg>
  );
}

const OPTIONS: { value: ViewMode; label: string; show: string }[] = [
  { value: "list", label: "List view", show: "flex" },
  { value: "2", label: "2 columns", show: "flex" },
  { value: "3", label: "3 columns", show: "hidden md:flex" },
  { value: "4", label: "4 columns", show: "hidden xl:flex" },
];

/** List / 2 / 3 / 4 column switch. Wider grids appear only where they fit (3 from md, 4 from xl). */
export default function GridListToggle({ active, onChange }: { active: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="group" aria-label="Product layout" className="flex items-center gap-1 sm:gap-2">
      {OPTIONS.map((o) => {
        const on = active === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            aria-label={o.label}
            title={o.label}
            className={`${o.show} h-11 min-w-11 items-center justify-center px-1 transition-colors md:h-9 md:min-w-9 ${on ? "text-ink" : "text-ink-muted hover:text-ink"}`}
          >
            {o.value === "list" ? <ListGlyph filled={on} /> : <Dots cols={Number(o.value)} filled={on} />}
          </button>
        );
      })}
    </div>
  );
}
