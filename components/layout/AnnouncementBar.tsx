"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";

// Modave top bar: a thin white strip with a bottom rule and the centred uppercase announcement.
// The reference's side slots hold social icons and currency/language pickers; we have no real social
// accounts or currencies, so xl+ shows our real support contacts on the left and help links on the right.
export default function AnnouncementBar() {
  const { announcement, store } = useSiteSettings();
  if (!announcement.enabled || !announcement.text) return null;

  const text = announcement.link ? (
    announcement.link.startsWith("/") ? (
      <Link href={announcement.link} className="hover:text-primary-hover transition-colors">{announcement.text}</Link>
    ) : (
      <a href={announcement.link} target="_blank" rel="noreferrer" className="hover:text-primary-hover transition-colors">{announcement.text}</a>
    )
  ) : (
    announcement.text
  );

  const phoneHref = store.supportPhone ? `tel:${store.supportPhone.replace(/[^\d+]/g, "")}` : "";

  return (
    <div data-testid="announcement-bar" className="bg-canvas text-ink border-b border-line">
      <div className="mx-auto max-w-[1320px] px-[15px] min-h-[37px] xl:min-h-[49px] py-2 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <div className="hidden xl:flex items-center gap-5 text-sm text-ink-secondary min-w-0">
          {store.supportPhone && (
            <a href={phoneHref} className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-primary-hover transition-colors">
              <Phone aria-hidden="true" className="w-3.5 h-3.5" />
              {store.supportPhone}
            </a>
          )}
          {store.supportEmail && (
            <a href={`mailto:${store.supportEmail}`} className="inline-flex items-center gap-1.5 min-w-0 truncate hover:text-primary-hover transition-colors">
              <Mail aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{store.supportEmail}</span>
            </a>
          )}
        </div>
        <p
          data-testid="announcement-text"
          className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.06em] sm:tracking-[0.1em] leading-5 line-clamp-2 sm:line-clamp-1 min-w-0 xl:max-w-[640px]"
        >
          {text}
        </p>
        <div className="hidden xl:flex items-center justify-end gap-5 text-sm text-ink-secondary">
          <Link href="/track-order" className="whitespace-nowrap hover:text-primary-hover transition-colors">Track Order</Link>
          <Link href="/faqs" className="whitespace-nowrap hover:text-primary-hover transition-colors">Help &amp; FAQs</Link>
        </div>
      </div>
    </div>
  );
}
