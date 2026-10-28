"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SORT_OPTIONS, SortKey } from "./shopData";

/** Modave "tf-dropdown-sort": bordered button with a floating option list (listbox, keyboard operable). */
export default function SortDropdown({ value, onChange, options = SORT_OPTIONS }: { value: SortKey; onChange: (v: SortKey) => void; options?: typeof SORT_OPTIONS }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    listRef.current?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, options, value]);

  const choose = (v: SortKey) => {
    setOpen(false);
    btnRef.current?.focus();
    if (v !== value) onChange(v);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active].value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`Sort by: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-11 items-center gap-2 rounded border-2 border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-ink md:h-9 lg:px-3.5"
      >
        <span className="max-w-[9.5rem] truncate sm:max-w-none">{current.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label="Sort by"
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
          className="absolute right-0 top-full z-30 mt-2 w-max min-w-full rounded bg-surface p-1.5 shadow-luxury outline-none ring-1 ring-line"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
              className={`flex min-h-[40px] cursor-pointer items-center justify-between gap-4 rounded-sm px-3.5 text-sm transition-colors ${
                i === active ? "bg-surface-muted text-ink" : "text-ink-secondary"
              } ${o.value === value ? "font-medium text-ink" : ""}`}
            >
              {o.label}
              {o.value === value && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
