"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onConsentOpen, readConsent, saveConsent } from "@/lib/consent";

// Cookie choices for analytics (Google Analytics) and marketing (Meta Pixel, ads). Shown until the visitor chooses,
// and again from the footer's "Cookie settings". Nothing optional is stored before a choice (Consent Mode v2
// defaults to denied). Only rendered where trackers exist (the live site), never in the admin.
export default function ConsentBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const current = readConsent();
    if (!current) setOpen(true);
    return onConsentOpen(() => {
      const saved = readConsent();
      setAnalytics(saved ? saved.analytics : true);
      setMarketing(saved ? saved.marketing : false);
      setCustom(true);
      setOpen(true);
    });
  }, []);

  if (!open || pathname?.startsWith("/admin")) return null;

  const choose = (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice);
    setOpen(false);
    setCustom(false);
  };

  const button = "inline-flex items-center justify-center h-10 px-4 rounded-full text-sm font-semibold transition-colors";

  return (
    <section
      role="region"
      aria-label="Cookie choices"
      className="fixed z-50 left-3 right-3 md:left-6 md:right-auto md:max-w-md rounded-2xl border border-line bg-canvas text-ink shadow-[0_8px_30px_rgb(var(--color-ink)/0.15)] p-5"
      style={{ bottom: "calc(var(--bottom-nav-h, 0px) + 12px)" }}
    >
      <h2 className="text-base font-semibold">Your cookie choices</h2>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">
        We use cookies that the shop needs to work. With your permission we also use analytics cookies to understand
        how the site is used, and marketing cookies to measure our ads. See our{" "}
        <Link href="/policies/privacy" className="underline underline-offset-2 text-ink hover:text-primary-hover">
          Privacy Policy
        </Link>
        .
      </p>

      {custom && (
        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Optional cookies</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
            <span>
              <span className="font-medium">Necessary</span>
              <span className="block text-ink-secondary">Cart, sign-in and checkout. Always on.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>
              <span className="font-medium">Analytics</span>
              <span className="block text-ink-secondary">Google Analytics: visits, pages and purchases, without your name or contact details.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>
              <span className="font-medium">Marketing</span>
              <span className="block text-ink-secondary">Meta and Google ads measurement.</span>
            </span>
          </label>
        </fieldset>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {custom ? (
          <button type="button" className={`${button} bg-primary text-on-primary hover:bg-primary-hover`} onClick={() => choose({ analytics, marketing })}>
            Save choices
          </button>
        ) : (
          <>
            <button type="button" className={`${button} bg-primary text-on-primary hover:bg-primary-hover`} onClick={() => choose({ analytics: true, marketing: true })}>
              Accept all
            </button>
            <button type="button" className={`${button} border border-line text-ink hover:bg-surface-muted`} onClick={() => choose({ analytics: false, marketing: false })}>
              Reject optional
            </button>
            <button type="button" className={`${button} text-ink underline underline-offset-2 hover:text-primary-hover px-2`} onClick={() => setCustom(true)}>
              Choose
            </button>
          </>
        )}
      </div>
    </section>
  );
}
