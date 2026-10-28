"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

// Render errors inside the site layout: the header and footer stay, the page offers a retry.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[page-error]", error.digest || "", error.message);
  }, [error]);

  return (
    <section className="bg-canvas text-ink py-16 md:py-24">
      <div className="max-w-xl mx-auto px-4 text-center">
        <p aria-hidden="true" className="font-medium leading-none text-[72px] md:text-[120px] tracking-tight">Oops!</p>
        <p className="mt-6 text-sm font-medium text-ink-muted">Something went wrong</p>
        <h1 className="mt-1 text-[28px] leading-9 md:text-[40px] md:leading-[48px] font-medium">This page could not be shown</h1>
        <p className="mt-3 text-base leading-[26px] text-ink-secondary">
          We hit a problem while loading this page. Please try again. If it keeps happening, our team can help from the contact page.
        </p>
        {error.digest && <p className="mt-2 text-xs text-ink-muted">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors"
          >
            <RotateCcw aria-hidden="true" className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-ink text-ink text-sm md:text-base font-semibold hover:bg-primary hover:text-on-primary transition-colors"
          >
            Home
          </Link>
          <Link href="/contact" className="inline-flex items-center min-h-11 px-2 text-sm text-ink underline underline-offset-4 hover:text-primary-hover">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
