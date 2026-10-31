"use client";

import { BRAND } from "@/lib/brand";
import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { btnPrimary, inputClass, labelClass } from "@/components/auth/ui";

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailOrPhone.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter the email address you registered with.");
      return;
    }

    setLoading(true);
    setError(null);

    // The confirmation is shown only when the server accepted the request. The server answers the same
    // way for known and unknown addresses, so this page does not reveal who has an account.
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setError("Too many requests. Please wait a few minutes and try again.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "We could not process your request. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error: your request was not sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit
      title="Forgot Password"
      crumbs={[{ label: "Home", href: "/" }, { label: "Account", href: "/account" }, { label: "Forgot Password" }]}
      aside={{
        heading: "New Customer",
        text: `New to ${BRAND.name}? Create an account to follow your orders, keep a wishlist and check out faster with saved addresses.`,
        href: "/auth/register",
        cta: "Create an Account",
      }}
    >
      {submitted ? (
        /* SUBMITTED STATE */
        <div className="space-y-4">
          <div className="w-14 h-14 bg-success-bg text-success rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>

          <h2 className="font-heading text-2xl md:text-[30px] md:leading-[42px] font-medium text-ink">Instructions Dispatched</h2>

          <p className="text-base text-ink-secondary leading-relaxed">
            We have transmitted secure password reset instructions to{" "}
            <span className="font-semibold text-ink break-all">{emailOrPhone}</span>. Please check your inbox or SMS message folder
            within the next 15 minutes.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/auth/login" className={btnPrimary}>
              Return to Sign In
            </Link>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="min-h-[44px] text-base text-ink underline underline-offset-2 hover:text-primary-hover"
            >
              Didn&apos;t receive instructions? Try another email
            </button>
          </div>
        </div>
      ) : (
        /* FORM STATE */
        <div>
          <div className="mb-6 text-center sm:text-left">
            <h1 className="font-heading text-2xl sm:text-[30px] md:text-[32px] font-medium text-stone-900 tracking-tight leading-tight">
              Reset Password
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed font-sans">
              Enter your registered email address and we will send you a secure link to choose a new password.
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-6 rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            <div>
              <label htmlFor="forgot-email" className={labelClass}>
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="you@example.com"
                className={inputClass(Boolean(error))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Dispatching Instructions...
                  </>
                ) : (
                  "Send Recovery Instructions"
                )}
              </button>
              <Link
                href="/auth/login"
                className="min-h-[44px] inline-flex items-center text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      )}
    </AuthSplit>
  );
}
