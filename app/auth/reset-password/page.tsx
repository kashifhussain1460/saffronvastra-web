"use client";

import { BRAND } from "@/lib/brand";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { btnPrimary, inputClass, labelClass } from "@/components/auth/ui";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Password reset token is missing. Please use the link provided in your email.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("Use at least one letter and one number in your password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data?.message || "Invalid or expired password reset token. Please request a new link.");
      }
    } catch (err: any) {
      console.error("[ResetPassword] Network error:", err);
      setError("Unable to connect to the authentication server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit
      title="Reset Password"
      crumbs={[{ label: "Home", href: "/" }, { label: "Account", href: "/auth/login" }, { label: "Create New Password" }]}
    >
      {success ? (
        /* SUCCESS STATE */
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>

          <h2 className="font-heading text-2xl md:text-[30px] md:leading-[42px] font-medium text-ink">Password Updated</h2>

          <p className="text-base text-ink-secondary leading-relaxed">
            Your bespoke account credentials have been securely updated. You can now sign in using your new password.
          </p>

          <div className="pt-4">
            <Link href="/auth/login" className={btnPrimary}>
              Sign In to {BRAND.name}
            </Link>
          </div>
        </div>
      ) : !token ? (
        /* MISSING TOKEN STATE */
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-warning-bg text-warning rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" aria-hidden="true" />
          </div>

          <h2 className="font-heading text-2xl md:text-[30px] md:leading-[42px] font-medium text-ink">Invalid Reset Link</h2>

          <p className="text-base text-ink-secondary leading-relaxed">
            No password reset token was detected in your request URL. Please ensure you clicked the complete link sent to your email
            address, or request a fresh link below.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link href="/auth/forgot-password" className={btnPrimary}>
              Request New Reset Link
            </Link>

            <Link
              href="/auth/login"
              className="min-h-[44px] inline-flex items-center text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      ) : (
        /* FORM STATE */
        <div>
          <div className="mb-6 text-center sm:text-left">
            <h1 className="font-heading text-2xl sm:text-[30px] md:text-[32px] font-medium text-stone-900 tracking-tight leading-tight">
              Set New Password
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed font-sans">
              Please choose a strong, unique password with at least 8 characters to safeguard your bespoke commissions.
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-6 rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="reset-password" className={labelClass}>
                New Password
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={`${inputClass()} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className={labelClass}>
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className={inputClass()}
              />
            </div>

            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <ShieldCheck className="w-4 h-4 text-ink" aria-hidden="true" />
              <span>End-to-end Argon2id credential hashing</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Updating Password...
                  </>
                ) : (
                  "Save New Password"
                )}
              </button>
              <Link
                href="/auth/forgot-password"
                className="min-h-[44px] inline-flex items-center text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
              >
                Resend Reset Link
              </Link>
            </div>
          </form>
        </div>
      )}
    </AuthSplit>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center p-8">
          <h1 className="font-heading text-2xl text-ink font-medium">{BRAND.name} Password Recovery</h1>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mt-4" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
