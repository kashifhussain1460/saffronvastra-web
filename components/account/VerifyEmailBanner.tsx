"use client";

import React, { useEffect, useState } from "react";
import { MailWarning } from "lucide-react";

// Shown across the account area until the customer has confirmed their email address.
export default function VerifyEmailBanner() {
  const [unverified, setUnverified] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/me", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.data && body.data.emailVerified === false) setUnverified(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!unverified) return null;

  const resend = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
      const body = await res.json().catch(() => null);
      setMessage(body?.message || (res.ok ? "A new confirmation link has been sent." : "We could not send a new link right now."));
      setState(res.ok ? "sent" : "error");
    } catch {
      setMessage("We could not reach the server. Please try again.");
      setState("error");
    }
  };

  return (
    <div role="region" aria-label="Confirm your email" className="bg-warning-bg border-b border-warning-line">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] py-3 flex flex-wrap items-center gap-3 text-sm text-warning">
        <MailWarning className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Please confirm your email address. We sent you a link when you created your account.</span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={state === "sending" || state === "sent"}
          className="ml-auto min-h-[44px] px-5 text-sm font-semibold text-ink bg-surface border border-warning-line rounded-full hover:border-ink disabled:opacity-60"
        >
          {state === "sending" ? "Sending..." : state === "sent" ? "Link sent" : "Send a new link"}
        </button>
        {message && (
          <p role={state === "error" ? "alert" : "status"} className="basis-full text-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
