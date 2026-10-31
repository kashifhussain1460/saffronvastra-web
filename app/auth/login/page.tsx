"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { btnPrimary, inputClass, labelClass } from "@/components/auth/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectQuery = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const loginEmail = email.trim();
    const loginPassword = password;

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const u = data.data?.user;
        const isAdmin = u?.roles?.includes("ADMIN");
        try {
          localStorage.setItem(
            "saffron_user",
            JSON.stringify({
              name: u?.fullName || "",
              email: u?.email || loginEmail,
              phone: u?.phone || "",
              role: isAdmin ? "admin" : "customer",
              tier: u?.tier || "Circle Member",
            })
          );
        } catch {}

        // Merge guest data (cart, tracking) if guest identity exists
        const gid = typeof window !== "undefined" ? localStorage.getItem("saffron_guest_id") : null;
        if (gid) {
          try {
            await fetch("/api/v1/guest/merge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ guestId: gid }),
            });
          } catch {}
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("saffron:auth-change"));
          window.dispatchEvent(new Event("saffron:sync-cart"));
        }

        setLoading(false);
        const destination =
          redirectQuery && redirectQuery.startsWith("/") && !redirectQuery.startsWith("//")
            ? redirectQuery
            : isAdmin
            ? "/admin/orders"
            : "/account";

        router.push(destination);
        return;
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.code === "EMAIL_NOT_VERIFIED") {
          // Address not confirmed yet: offer new link
          setLoading(false);
          router.push(
            `/auth/verify-email/sent?email=${encodeURIComponent(loginEmail.toLowerCase())}${
              redirectQuery ? `&redirect=${encodeURIComponent(redirectQuery)}` : ""
            }`
          );
          return;
        }
        setError(errData?.message || "Invalid credentials. Please verify your email and password.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error("[LoginPage] Login network failure:", err);
      setError("Unable to connect to the authentication service. Please verify your internet connection and try again.");
      setLoading(false);
    }
  };

  return (
    <AuthSplit
      title="Sign In"
      crumbs={[
      
      ]}
      aside={{
        heading: "New Customer",
        text: "Create an account to follow your orders, keep a wishlist and check out faster with saved addresses.",
        href: redirectQuery ? `/auth/register?redirect=${encodeURIComponent(redirectQuery)}` : "/auth/register",
        cta: "Create an Account",
      }}
    >
      <div className="mb-6 sm:mb-7 text-center sm:text-left">
        <h1 className="font-heading text-[28px] sm:text-[34px] lg:text-[36px] font-medium text-stone-900 tracking-tight leading-tight">
          Welcome Back
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-500 leading-relaxed font-sans">
          Sign in to view your orders, wishlist and saved addresses.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-xs sm:text-sm text-red-700 font-sans"
        >
          {error}
        </div>
      )}

      <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={inputClass()}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`${inputClass()} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-0.5">
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-stone-800 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-800 hover:text-stone-950 transition-colors font-sans"
          >
            Forgot Your Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimary} mt-2`}
        >
          {loading ? (
            <>
              <span
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthSplit>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
          <h1 className="sr-only">Sign In to Saffron Vastra</h1>
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
