"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import AuthSplit from "@/components/auth/AuthSplit";
import { btnPrimary } from "@/components/auth/ui";

// Shown right after registration (and when an unconfirmed account tries to sign in): the account opens only after
// the link in the email has been used.
function SentContent() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const redirect = params.get("redirect");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const resend = async () => {
    if (!email) return;
    setState("sending");
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => null);
      setMessage(body?.message || (res.ok ? "If the account exists and is not yet confirmed, a new link has been sent." : "We could not send a new link right now."));
      setState(res.ok ? "sent" : "error");
    } catch {
      setMessage("We could not reach the server. Please check your connection and try again.");
      setState("error");
    }
  };

  const signIn = `/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;

  return (
    <AuthSplit title="Verify Email" crumbs={[{ label: "Home", href: "/" }, { label: "Account", href: "/account" }, { label: "Verify Email" }]}>
      <div className="text-center space-y-5">
        <MailCheck className="w-12 h-12 text-ink mx-auto" aria-hidden="true" />
        <h2 className="font-heading text-2xl md:text-[30px] md:leading-[42px] font-medium text-ink">Confirm your email</h2>
        <p className="text-base text-ink-secondary leading-relaxed">
          We have sent a confirmation link to {email ? <strong className="text-ink break-all">{email}</strong> : "your email address"}. Open it to activate your
          account, then sign in. The link works for 24 hours.
        </p>
        <p className="text-sm text-ink-muted">Nothing there? Check your spam or promotions folder, or ask for a new link.</p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void resend()}
            disabled={!email || state === "sending" || state === "sent"}
            className={btnPrimary}
          >
            {state === "sending" ? "Sending..." : state === "sent" ? "New link sent" : "Send a new link"}
          </button>
          {message && (
            <p role={state === "error" ? "alert" : "status"} className={`text-sm ${state === "error" ? "text-error" : "text-success"}`}>
              {message}
            </p>
          )}
          <Link href={signIn} className="inline-flex items-center min-h-[44px] text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
            I have confirmed my email: sign in
          </Link>
        </div>
      </div>
    </AuthSplit>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={null}>
      <SentContent />
    </Suspense>
  );
}
