"use client";

import { BRAND } from "@/lib/brand";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageTitle from "@/components/checkout/PageTitle";

type State = "idle" | "working" | "done" | "invalid" | "error";

function UnsubscribeForm() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<State>(token ? "idle" : "invalid");
  const [email, setEmail] = useState("");

  const confirm = async () => {
    setState("working");
    try {
      const res = await fetch("/api/v1/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.status === 404) return setState("invalid");
      if (!res.ok) return setState("error");
      const body = await res.json().catch(() => null);
      setEmail(body?.data?.email || "");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="bg-canvas text-ink">
      <PageTitle title="Unsubscribe" crumbs={[{ label: "Home", href: "/" }, { label: "Newsletter" }]} />
      <section className="py-10 md:py-20 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-line p-6 md:p-8 text-center">
          {state === "idle" && (
            <>
              <p className="text-base leading-[26px] text-ink-secondary mb-6">Do you want to stop receiving newsletters from {BRAND.name}?</p>
              <button
                type="button"
                onClick={() => void confirm()}
                className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors"
              >
                Yes, unsubscribe me
              </button>
            </>
          )}
          {state === "working" && <p role="status" className="text-base">Updating your preference...</p>}
          {state === "done" && (
            <p role="status" className="text-base leading-[26px] text-ink-secondary">
              {email ? `${email} has` : "You have"} been unsubscribed. You will not receive any more newsletters. Order and account emails will still reach you.
            </p>
          )}
          {state === "invalid" && (
            <p role="alert" className="text-base leading-[26px] text-error">
              This unsubscribe link is not valid. Please use the link from the latest newsletter, or contact us and we will remove you.
            </p>
          )}
          {state === "error" && (
            <p role="alert" className="text-base leading-[26px] text-error">
              We could not update your preference right now. Please try again in a moment.
            </p>
          )}
          <Link href="/" className="inline-flex items-center min-h-11 mt-6 text-sm text-ink underline underline-offset-4 hover:text-primary-hover">
            Back to the store
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeForm />
    </Suspense>
  );
}
