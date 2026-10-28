"use client";

import React, { useEffect, useRef, useState } from "react";

/** Sticky in-page contents list for policy pages; marks the section currently in view. */
export default function PolicyNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const listRef = useRef<HTMLUListElement>(null);

  // A long list scrolls inside its own box: keep the current section in view there (never scrolls the page itself).
  useEffect(() => {
    const link = listRef.current?.querySelector<HTMLElement>('a[aria-current="location"]');
    const box = link?.closest<HTMLElement>(".overflow-y-auto");
    if (!link || !box || box.scrollHeight <= box.clientHeight) return;
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop || top + link.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 2), behavior: "smooth" });
    }
  }, [active]);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page">
      <ul ref={listRef} className="border-l border-line">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={() => setActive(s.id)}
                className={`block -ml-px border-l py-2.5 pl-4 text-base md:text-lg leading-7 transition-colors ${
                  isActive ? "border-ink text-ink font-medium" : "border-transparent text-ink-secondary hover:text-ink"
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
