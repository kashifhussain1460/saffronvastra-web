"use client";

import React from "react";
import { Truck, Scissors, Banknote, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";
import Carousel from "./Carousel";
import { CONTAINER, SECTION_BOTTOM } from "./SectionHeading";

// Modave icon-box strip. Only promises the shop already makes: the free-shipping threshold from
// the store settings, made to order, Cash on Delivery (the only payment method), handcrafted in Jaipur.
export default function ServiceHighlights() {
  const { shipping, cod } = useSiteSettings();

  const items = [
    shipping.freeShippingThreshold > 0 && {
      Icon: Truck,
      title: "Complimentary Shipping",
      text: `On orders above ₹${shipping.freeShippingThreshold.toLocaleString("en-IN")}.`,
    },
    {
      Icon: Scissors,
      title: "Made to Order",
      text: "Each creation is made to order by skilled artisans.",
    },
    cod.enabled && {
      Icon: Banknote,
      title: "Cash on Delivery",
      text: "Pay in cash when your order arrives.",
    },
    {
      Icon: Sparkles,
      title: "Handcrafted in Jaipur",
      text: "Hand embroidered by our artisans in Rajasthan.",
    },
  ].filter(Boolean) as { Icon: typeof Truck; title: string; text: string }[];

  return (
    <section aria-label="Why shop with us" className={`bg-canvas ${SECTION_BOTTOM}`}>
      <div className={CONTAINER}>
        <Carousel
          label="Why shop with us"
          gapClassName="gap-[15px]"
          slideClassName="basis-full md:basis-[calc((100%-30px)/3)] lg:basis-[calc((100%-45px)/4)]"
          centerFew
        >
          {items.map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center gap-5 px-2 text-center">
              <Icon className="h-10 w-10 text-ink" strokeWidth={1.25} aria-hidden="true" />
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-medium leading-6 text-ink xl:text-xl xl:leading-7">{title}</h3>
                <p className="text-base leading-[26px] text-ink-secondary">{text}</p>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
