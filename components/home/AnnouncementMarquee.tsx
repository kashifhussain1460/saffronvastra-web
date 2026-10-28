"use client";

import React from "react";
import { Zap } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";

// Modave scrolling strip above the newsletter. Messages are the store's own: the announcement
// from settings plus the made-to-order and Cash on Delivery facts. Stops for reduced motion.
export default function AnnouncementMarquee() {
  const { announcement, cod } = useSiteSettings();
  const messages = [
    announcement.enabled && announcement.text ? announcement.text : null,
    "Made to order in Jaipur",
    cod.enabled ? "Cash on Delivery" : null,
  ].filter(Boolean) as string[];

  // Enough copies to cover wide screens; the second half makes the loop seamless.
  const run = Array.from({ length: 4 }, () => messages).flat();

  return (
    <section aria-label="Store information" className="overflow-hidden border-t border-line bg-canvas py-4">
      <style>{`@keyframes home-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <p className="sr-only">{messages.join(". ")}</p>
      <div
        aria-hidden="true"
        className="flex w-max animate-[home-marquee_40s_linear_infinite] motion-reduce:animate-none hover:[animation-play-state:paused]"
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {run.map((m, i) => (
              <React.Fragment key={`${half}-${i}`}>
                <span className="whitespace-nowrap px-[15px] text-xs font-semibold uppercase leading-5 text-ink md:px-[25px]">
                  {m}
                </span>
                <Zap className="mx-[15px] h-4 w-4 shrink-0 text-ink md:mx-[25px]" strokeWidth={1.5} />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
