"use client";

import React, { useEffect, useState } from "react";

// The customer's own switch for sale alerts and offers by email (stored on the account; the default is off).
export default function MarketingConsent() {
  const [on, setOn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/me/marketing-consent", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) setOn(Boolean(json.data.emailMarketing));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const change = async (next: boolean) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/me/marketing-consent", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailMarketing: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message);
      setOn(Boolean(json?.data?.emailMarketing));
      setMessage({ text: json?.message || "Saved.", isError: false });
    } catch (error: any) {
      setMessage({ text: error?.message || "Your preference could not be saved. Please try again.", isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-line p-5" data-testid="marketing-consent">
      <h3 className="text-lg font-medium text-ink">Offers by email</h3>
      <label className="mt-3 flex items-start gap-3 text-base text-ink-secondary">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-primary"
          checked={Boolean(on)}
          disabled={on === null || saving}
          onChange={(e) => void change(e.target.checked)}
        />
        <span>
          Email me when pieces in my favourites or bag go on sale, and about other offers. You can switch this off any time,
          and every offer email has an unsubscribe link.
        </span>
      </label>
      {message && (
        <p role={message.isError ? "alert" : "status"} className={`mt-2 text-sm ${message.isError ? "text-error" : "text-success"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
