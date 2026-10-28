"use client";

import React, { useId, useState } from "react";
import { Check } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/newsletter";

interface NewsletterBannerProps {
  /** Recorded with the sign-up so the admin can see where it came from. */
  source?: string;
  title?: string;
  description?: string;
  /** Space above the band. Pages that end in content keep the default gap; the home page sits flush. */
  className?: string;
}

// Modave newsletter band: centred heading, one-line text and a pill input with the button inside it.
export default function NewsletterBanner({
  source = "newsletter-banner",
  title = "Be Part of the Saffron Circle",
  description = "Get early access to new collections, exclusive offers, and stories from our Jaipur artisans.",
  className = "mt-16 sm:mt-24",
}: NewsletterBannerProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const [sending, setSending] = useState(false);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setNewsletterError("");
    const result = await subscribeToNewsletter(email, source);
    setSending(false);
    if (result.ok) setSubscribed(true);
    else setNewsletterError(result.message);
  };

  return (
    <section aria-label="Newsletter" className={`bg-surface-muted px-[15px] py-11 ${className}`}>
      <div className="mx-auto max-w-[564px] text-center">
        <h2 className="text-[28px] font-medium leading-9 text-ink md:text-[30px] md:leading-[38px] xl:text-[40px] xl:leading-[48px]">
          {title}
        </h2>
        <p className="mb-9 mt-3 text-base leading-[26px] text-ink-secondary">{description}</p>

        {subscribed ? (
          <div
            role="status"
            className="mx-auto flex min-h-14 items-center justify-center gap-2.5 rounded-full border border-line bg-surface px-5 text-sm font-medium text-ink"
          >
            <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span>Welcome to the Saffron Circle. We will be in touch soon.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative">
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              aria-describedby={newsletterError ? errorId : undefined}
              aria-invalid={newsletterError ? true : undefined}
              className="h-14 w-full rounded-full border border-line bg-surface pl-4 pr-[132px] text-base text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-line-strong sm:text-sm md:pr-[180px]"
            />
            <button
              type="submit"
              disabled={sending}
              className="absolute right-1.5 top-1.5 inline-flex h-11 items-center justify-center rounded-full border border-primary bg-primary px-4 text-sm font-semibold uppercase leading-5 text-on-primary transition-colors hover:border-primary-hover hover:bg-primary-hover disabled:opacity-70 md:px-10"
            >
              {sending ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
        {newsletterError && (
          <p id={errorId} role="alert" className="mt-3 text-sm text-error">
            {newsletterError}
          </p>
        )}
      </div>
    </section>
  );
}
