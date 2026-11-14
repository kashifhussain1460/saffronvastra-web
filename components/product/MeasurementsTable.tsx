"use client";

import { useState } from "react";
import { inUnit, type MeasurementRow } from "@/lib/sizeChart";

interface MeasurementsTableProps {
  rows: MeasurementRow[];
  caption: string;
  note?: string;
  // highlights one size (the one selected on the product page)
  highlightSize?: string | null;
}

// Garment measurements per size with an inches / centimetres switch. Columns without any value are left out
// (long kimonos have no shoulder seam).
export default function MeasurementsTable({ rows, caption, note, highlightSize }: MeasurementsTableProps) {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  if (!rows.length) return null;

  const hasFits = rows.some((r) => r.fitsChestMin !== undefined && r.fitsChestMax !== undefined);
  const hasShoulder = rows.some((r) => r.shoulder !== undefined);
  const hasSleeve = rows.some((r) => r.sleeve !== undefined);
  const u = unit === "in" ? '"' : " cm";
  const cell = (v?: number) => (v === undefined ? "–" : `${inUnit(v, unit)}${u}`);
  const toggle = (value: "in" | "cm", label: string) => (
    <button
      type="button"
      aria-pressed={unit === value}
      onClick={() => setUnit(value)}
      className={`rounded-md px-4 min-h-9 text-sm font-medium transition-colors ${
        unit === value ? "bg-surface-muted text-ink" : "text-ink-secondary hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{caption}</p>
        <div className="inline-flex border border-line rounded-lg bg-surface p-1" role="group" aria-label="Units">
          {toggle("in", "Inches")}
          {toggle("cm", "CM")}
        </div>
      </div>
      {/* Focusable so the table can be scrolled sideways with the keyboard on narrow screens. */}
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={caption}>
        <table className="w-full min-w-[420px] text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line text-ink">
              <th scope="col" className="py-2.5 pr-3 font-medium">Size</th>
              {hasFits && <th scope="col" className="py-2.5 pr-3 font-medium">Fits chest</th>}
              <th scope="col" className="py-2.5 pr-3 font-medium">Garment chest</th>
              {hasShoulder && <th scope="col" className="py-2.5 pr-3 font-medium">Shoulder</th>}
              {hasSleeve && <th scope="col" className="py-2.5 pr-3 font-medium">Sleeve</th>}
              <th scope="col" className="py-2.5 font-medium">Length</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {rows.map((r) => (
              <tr key={r.size} className={r.size === highlightSize ? "bg-surface-muted font-medium" : undefined}>
                <th scope="row" className="py-3 pr-3 font-medium text-left">{r.size}</th>
                {hasFits && (
                  <td className="py-3 pr-3">
                    {r.fitsChestMin !== undefined && r.fitsChestMax !== undefined
                      ? `${inUnit(r.fitsChestMin, unit)}–${inUnit(r.fitsChestMax, unit)}${u}`
                      : "–"}
                  </td>
                )}
                <td className="py-3 pr-3">{cell(r.chest)}</td>
                {hasShoulder && <td className="py-3 pr-3">{cell(r.shoulder)}</td>}
                {hasSleeve && <td className="py-3 pr-3">{cell(r.sleeve)}</td>}
                <td className="py-3">{cell(r.length)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-xs leading-relaxed text-ink-secondary">{note}</p>}
    </div>
  );
}
