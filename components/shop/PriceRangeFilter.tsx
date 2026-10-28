"use client";

import React, { useEffect, useState } from "react";

const thumb =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-surface " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-surface";

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
          className={`pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent ${thumb}`}
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
          className={`pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent ${thumb}`}
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
