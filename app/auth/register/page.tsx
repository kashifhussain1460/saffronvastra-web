"use client";

import { BRAND } from "@/lib/brand";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { emailError, mobileError, nameError, nationalMobileDigits, passwordError, passwordStrength } from "@/lib/validation";
import { Eye, EyeOff } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { btnPrimary, errorText, inputClass, labelClass } from "@/components/auth/ui";

type Field = "fullName" | "email" | "phone" | "password" | "confirmPassword" | "terms";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectQuery = searchParams.get("redirect");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // the 10 national digits; +91 is shown as a fixed prefix
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // consent is never pre-ticked
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(password);

  const errors: Partial<Record<Field, string>> = {
    fullName: nameError(fullName) || undefined,
    email: emailError(email) || undefined,
    phone: mobileError(phone) || undefined,
    password: passwordError(password) || undefined,
    confirmPassword: !confirmPassword ? "Please repeat your password" : confirmPassword !== password ? "The passwords do not match" : undefined,
    terms: termsConsent ? undefined : "Please accept the Terms of Service and Privacy Policy",
  };
  // a field shows its problem once the shopper has left it (or tried to submit); a server answer wins
  const shown = (field: Field) => serverErrors[field] || (touched[field] ? errors[field] : undefined);
  const touch = (field: Field) => setTouched((t) => ({ ...t, [field]: true }));
  const clearServer = (field: Field) => setServerErrors((e) => ({ ...e, [field]: undefined }));
  const fieldClass = (field: Field) => inputClass(Boolean(shown(field)));
  const describedBy = (field: Field) => (shown(field) ? `${field}-error` : undefined);
  const FieldError = ({ field }: { field: Field }) =>
    shown(field) ? (
      <p id={`${field}-error`} role="alert" className={errorText}>
        {shown(field)}
      </p>
    ) : null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setServerErrors({});
    setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true, terms: true });
    const firstInvalid = (Object.keys(errors) as Field[]).find((k) => errors[k]);
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus();
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName: fullName.trim().replace(/\s+/g, " "),
          phone: `+91 ${nationalMobileDigits(phone)}`,
          guestId: (() => {
            try {
              return localStorage.getItem("saffron_guest_id") || undefined;
            } catch {
              return undefined;
            }
          })(),
        }),
      });
      const body = await res.json().catch(() => null);

      if (res.ok) {
        if (newsletterConsent) {
          // the shopper asked for the newsletter: sign them up (the welcome mail carries an unsubscribe link)
          await fetch("/api/v1/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, source: "register" }),
          }).catch(() => undefined);
        }
        // No session yet: the account opens once the email address is confirmed.
        const next = redirectQuery && redirectQuery.startsWith("/") && !redirectQuery.startsWith("//") ? `&redirect=${encodeURIComponent(redirectQuery)}` : "";
        router.push(`/auth/verify-email/sent?email=${encodeURIComponent(cleanEmail)}${next}`);
        return;
      }

      if (res.status === 409) {
        setServerErrors({ email: "An account with this email already exists. Sign in instead, or use another email." });
      } else if (Array.isArray(body?.errors)) {
        // put each server message next to its field
        const mapped: Partial<Record<Field, string>> = {};
        for (const issue of body.errors) {
          const key = issue?.path?.[0] as Field | undefined;
          const message = issue?.code === "invalid_union" ? issue?.unionErrors?.[1]?.issues?.[0]?.message || issue?.message : issue?.message;
          if (key && !mapped[key]) mapped[key] = message;
        }
        setServerErrors(mapped);
        if (Object.keys(mapped).length === 0) setError(body?.message || "Please check the highlighted details.");
      } else {
        setError(body?.message || "We could not create your account. Please try again.");
      }
      setLoading(false);
    } catch {
      setError("We could not reach the server. Please check your internet connection and try again.");
      setLoading(false);
    }
  };

  const signInHref =
    redirectQuery && redirectQuery.startsWith("/") && !redirectQuery.startsWith("//")
      ? `/auth/login?redirect=${encodeURIComponent(redirectQuery)}`
      : "/auth/login";

  return (
    <AuthSplit
      title="Register"
      crumbs={[{ label: "Home", href: "/" }, { label: "Account", href: "/account" }, { label: "Create Account" }]}
      aside={{
        heading: "Already have an account?",
        text: "Welcome back. Sign in to see your orders, your wishlist and your saved addresses.",
        href: signInHref,
        cta: "Sign In",
      }}
    >
      <div className="mb-6 text-center sm:text-left">
        <h1 className="font-heading text-2xl sm:text-[30px] md:text-[32px] font-medium text-stone-900 tracking-tight leading-tight">
          Create Your Account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed font-sans">
          Fields marked <span className="text-secondary">*</span> are required.
        </p>
      </div>

      {/* Form-level error (network, server) */}
      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} noValidate className="mt-7 space-y-5" aria-label="Create your account">
        {/* Full Name */}
        <div>
          <label htmlFor="register-fullName" className={labelClass}>
            Full Name <span className="text-secondary">*</span>
          </label>
          <input
            id="register-fullName"
            type="text"
            autoComplete="name"
            maxLength={100}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              clearServer("fullName");
            }}
            onBlur={() => touch("fullName")}
            aria-invalid={Boolean(shown("fullName"))}
            aria-describedby={describedBy("fullName")}
            placeholder="e.g. Asha Verma"
            className={fieldClass("fullName")}
          />
          <FieldError field="fullName" />
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="register-email" className={labelClass}>
            Email Address <span className="text-secondary">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearServer("email");
            }}
            onBlur={() => touch("email")}
            aria-invalid={Boolean(shown("email"))}
            aria-describedby={describedBy("email")}
            placeholder="you@email.com"
            className={fieldClass("email")}
          />
          <FieldError field="email" />
          {serverErrors.email && /already exists/.test(serverErrors.email) && (
            <Link href="/auth/login" className="mt-1.5 inline-block text-sm font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
              Sign in to your account
            </Link>
          )}
        </div>

        {/* Phone Number: India only */}
        <div>
          <label htmlFor="register-phone" className={labelClass}>
            Mobile Number (India) <span className="text-secondary">*</span>
          </label>
          <div className="flex">
            <span
              className={`inline-flex items-center h-12 px-4 rounded-l-lg border-2 border-r-0 bg-surface-muted text-base text-ink-secondary select-none ${
                shown("phone") ? "border-error" : "border-line"
              }`}
              aria-hidden="true"
            >
              +91
            </span>
            <input
              id="register-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              // no maxLength: a pasted "+91 98765 43210" must reach onChange whole; it is reduced to 10 digits there
              value={phone}
              onChange={(e) => {
                // digits only; a pasted +91 / 0 prefix is removed
                setPhone(nationalMobileDigits(e.target.value));
                clearServer("phone");
              }}
              onBlur={() => touch("phone")}
              aria-invalid={Boolean(shown("phone"))}
              aria-describedby={shown("phone") ? "phone-error" : "phone-hint"}
              placeholder="98765 43210"
              className={`${fieldClass("phone")} rounded-l-none min-w-0`}
            />
          </div>
          {shown("phone") ? (
            <FieldError field="phone" />
          ) : (
            <p id="phone-hint" className="mt-1.5 text-sm text-ink-muted">
              10-digit Indian mobile number. We use it only for delivery updates.
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="register-password" className={labelClass}>
            Password <span className="text-secondary">*</span>
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              maxLength={128}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearServer("password");
              }}
              onBlur={() => touch("password")}
              aria-invalid={Boolean(shown("password"))}
              aria-describedby={describedBy("password")}
              placeholder="••••••••••••"
              className={`${fieldClass("password")} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <FieldError field="password" />

          {/* Password strength: guidance only, the rules are the error messages above */}
          {password && (
            <div className="mt-2 space-y-1" aria-live="polite">
              <div className="grid grid-cols-4 gap-1.5 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full transition-colors ${step <= strength ? (strength <= 2 ? "bg-warning" : "bg-success") : "bg-line"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-ink-muted text-right">
                {strength <= 1 ? "Weak password" : strength === 2 ? "Fair password" : strength === 3 ? "Good password" : "Strong password"}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="register-confirmPassword" className={labelClass}>
            Confirm Password <span className="text-secondary">*</span>
          </label>
          <input
            id="register-confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => touch("confirmPassword")}
            aria-invalid={Boolean(shown("confirmPassword"))}
            aria-describedby={describedBy("confirmPassword")}
            placeholder="••••••••••••"
            className={fieldClass("confirmPassword")}
          />
          <FieldError field="confirmPassword" />
        </div>

        {/* Consents (never pre-ticked) */}
        <div className="space-y-3 pt-1 text-base text-ink-secondary">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newsletterConsent}
              onChange={(e) => setNewsletterConsent(e.target.checked)}
              className="mt-1 w-[18px] h-[18px] shrink-0 accent-primary"
            />
            <span>Send me the {BRAND.name} newsletter with new pieces and styling stories (optional; unsubscribe any time).</span>
          </label>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="register-terms"
                type="checkbox"
                checked={termsConsent}
                onChange={(e) => {
                  setTermsConsent(e.target.checked);
                  touch("terms");
                }}
                aria-invalid={Boolean(shown("terms"))}
                aria-describedby={describedBy("terms")}
                className="mt-1 w-[18px] h-[18px] shrink-0 accent-primary"
              />
              <span>
                I agree to the{" "}
                <Link href="/policies/terms" className="text-ink font-medium underline underline-offset-2 hover:text-primary-hover">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/policies/privacy" className="text-ink font-medium underline underline-offset-2 hover:text-primary-hover">
                  Privacy Policy
                </Link>
                . <span className="text-secondary">*</span>
              </span>
            </label>
            <FieldError field="terms" />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </AuthSplit>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-surface flex items-center justify-center">
          <h1 className="sr-only">Create an Account</h1>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
