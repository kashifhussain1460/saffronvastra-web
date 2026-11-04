"use client";

import React, { useEffect, useState } from "react";

/*
 * Target size (WCAG 2.5.8, 24x24 CSS px). The drawn thumb is still a 16px circle with a 2px primary ring, but its box
 * is 24x24: a 4px transparent border is the extra hit area, the surface fill is clipped to the padding box (16px) and
 * the ring is an inset 2px shadow inside that 16px circle. The range inputs are 24px tall (centred on the 20px track
 * row, so the track does not move) and 8px wider (4px past each end), which keeps the thumb centre travelling over
 * exactly the same 8px..(width-8px) span as the old 16px thumb on a full-width input.
 */
const thumb =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-transparent [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:bg-clip-padding [&::-webkit-slider-thumb]:[box-shadow:inset_0_0_0_2px_rgb(var(--color-primary))] " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-transparent [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:bg-clip-padding [&::-moz-range-thumb]:[box-shadow:inset_0_0_0_2px_rgb(var(--color-primary))]";
// 24px tall, centred on the h-5 row (-2px), and 4px past each end of it (see the note above).
const rangeBox = "pointer-events-none absolute -left-1 -top-0.5 h-6 w-[calc(100%+0.5rem)] appearance-none bg-transparent";

/**
 * Two-thumb price slider with Min / Max number fields (Modave "facet-price").
 * Values are committed on release / blur / Enter so the URL is not rewritten on every pixel.
 */
export default function PriceRangeFilter({
  floor,
  ceiling,
  min,
  max,
  onCommit,
  idPrefix,
}: {
  floor: number;
  ceiling: number;
  min: number | null;
  max: number | null;
  onCommit: (min: number | null, max: number | null) => void;
  idPrefix: string;
}) {
  const step = 100;
  const [lo, setLo] = useState(min ?? floor);
  const [hi, setHi] = useState(max ?? ceiling);
  const [loText, setLoText] = useState(String(min ?? floor));
  const [hiText, setHiText] = useState(String(max ?? ceiling));

  useEffect(() => {
    setLo(min ?? floor);
    setLoText(String(min ?? floor));
  }, [min, floor]);
  useEffect(() => {
    setHi(max ?? ceiling);
    setHiText(String(max ?? ceiling));
  }, [max, ceiling]);

  const commit = (a: number, b: number) => {
    const nlo = Math.max(floor, Math.min(a, b));
    const nhi = Math.min(ceiling, Math.max(a, b));
    onCommit(nlo <= floor ? null : nlo, nhi >= ceiling ? null : nhi);
  };

  const pct = (v: number) => ((v - floor) / Math.max(1, ceiling - floor)) * 100;
  const commitFromText = () => {
    const a = Number(loText.replace(/[^\d]/g, ""));
    const b = Number(hiText.replace(/[^\d]/g, ""));
    commit(Number.isFinite(a) ? a : floor, Number.isFinite(b) && hiText.trim() !== "" ? b : ceiling);
  };
  const release = () => commit(lo, hi);

  return (
    <div>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={lo}
          aria-label="Minimum price"
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi - step);
            setLo(v);
            setLoText(String(v));
          }}
          onPointerUp={release}
          onKeyUp={release}
          onTouchEnd={release}
          className={`${rangeBox} ${thumb}`}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={hi}
          aria-label="Maximum price"
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo + step);
            setHi(v);
            setHiText(String(v));
          }}
          onPointerUp={release}
          onKeyUp={release}
          onTouchEnd={release}
          className={`${rangeBox} ${thumb}`}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 xl:gap-5">
        {[
          { id: `${idPrefix}-min`, label: "Min price", value: loText, set: setLoText },
          { id: `${idPrefix}-max`, label: "Max price", value: hiText, set: setHiText },
        ].map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="mb-1.5 block text-sm text-ink xl:text-base">
              {f.label}
            </label>
            <div className="flex h-11 items-center rounded-lg border border-line px-3 focus-within:border-primary xl:h-[38px]">
              <span className="mr-1 text-sm text-ink-muted" aria-hidden="true">
                ₹
              </span>
              <input
                id={f.id}
                inputMode="numeric"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                onBlur={commitFromText}
                onKeyDown={(e) => e.key === "Enter" && commitFromText()}
                className="w-full min-w-0 bg-transparent text-base text-ink outline-none xl:text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
