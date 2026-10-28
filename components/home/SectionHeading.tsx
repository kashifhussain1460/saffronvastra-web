import React from "react";

// Modave page container: 1320px wide including 15px side gutters.
export const CONTAINER = "mx-auto w-full max-w-[1320px] px-[15px]";
// Modave "flat-spacing": 60px top/bottom on phones and tablets, 80px on desktop.
export const SECTION_Y = "py-[60px] xl:py-20";
export const SECTION_BOTTOM = "pb-[60px] xl:pb-20";

interface SectionHeadingProps {
  id?: string;
  title: string;
  subtitle?: string;
}

// Centered section title with an optional one-line subtitle (Modave "heading-section").
export default function SectionHeading({ id, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-[30px] text-center md:mb-10">
      <h2
        id={id}
        className="text-2xl font-medium leading-[30px] text-ink md:text-[30px] md:leading-[38px] xl:text-[40px] xl:leading-[48px]"
      >
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-base leading-[26px] text-ink-secondary">{subtitle}</p>}
    </div>
  );
}
