"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, MailCheck } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { btnPrimary, inputClass, labelClass } from "@/components/auth/ui";

type State = "verifying" | "verified" | "invalid" | "error";

function VerifyEmailContent() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<State>(token ? "verifying" : "invalid");
  const [email, setEmail] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return; // React strict mode runs effects twice; a token can only be used once
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const body = await res.json().catch(() => null);
        if (res.ok) {
          setEmail(body?.data?.email || "");
          setState("verified");
        } else {
          setState(res.status === 400 ? "invalid" : "error");
        }
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendState("sending");
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: resendEmail }),
      });
      const body = await res.json().catch(() => null);
      setResendMessage(body?.message || (res.ok ? "If the account exists, a new link has been sent." : "We could not send a new link right now."));
      setResendState(res.ok ? "sent" : "error");
    } catch {
      setResendMessage("We could not reach the server. Please check your connection and try again.");
      setResendState("error");
    }
  };

  return (
    <AuthSplit title="Verify Email" crumbs={[{ label: "Home", href: "/" }, { label: "Account", href: "/account" }, { label: "Verify Email" }]}>
      <div className="text-center">
        {state === "verifying" && (
          <p role="status" className="text-base text-ink-secondary">
            Confirming your email address...
          </p>
        )}

        {state === "verified" && (
          <div role="status">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-heading text-2xl md:text-[30px] md:leading-[42px] font-medium text-ink mb-3">Email confirmed</h2>
            <p className="text-base text-ink-secondary mb-6">{email ? `${email} is confirmed.` : "Your email address is confirmed."} Thank you.</p>
            <Link href="/auth/login?redirect=%2Faccount" className={btnPrimary}>
              Sign in to your account
            </Link>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div>
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-heading text-2xl md:text-[30px] md:leading-[42px] font-medium text-ink mb-3">
              {state === "invalid" ? "This link cannot be used" : "Something went wrong"}
            </h2>
            <p role="alert" className="text-base text-ink-secondary mb-6">
              {state === "invalid"
                ? "This confirmation link is invalid, has expired or was already used. Ask for a new one below."
                : "We could not confirm your email right now. Please try the link again in a moment."}
            </p>
            <form onSubmit={resend} className="text-left space-y-4" aria-label="Send a new confirmation link">
              <label htmlFor="resend-email" className={labelClass}>
                Email address of your account
              </label>
              <input
                id="resend-email"
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className={inputClass()}
              />
              <button
                type="submit"
                disabled={resendState === "sending"}
                className={`${btnPrimary} w-full`}
              >
                <MailCheck className="w-4 h-4" aria-hidden="true" /> {resendState === "sending" ? "Sending..." : "Send a new link"}
              </button>
              {resendState === "sent" && <p role="status" className="text-sm text-success">{resendMessage}</p>}
              {resendState === "error" && <p role="alert" className="text-sm text-error">{resendMessage}</p>}
            </form>
          </div>
        )}

        <Link href="/" className="inline-flex items-center min-h-[44px] mt-6 text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
          Back to the store
        </Link>
      </div>
    </AuthSplit>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
