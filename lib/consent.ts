"use client";
// Visitor's cookie choices (analytics, marketing), kept in this browser only. The Google tag reads the same key
// before it loads (components/analytics/GoogleTag) to set Google Consent Mode v2 defaults; the Meta Pixel loads only
// with marketing consent. Nothing is granted until the visitor chooses.
import { useSyncExternalStore } from "react";

export const CONSENT_STORAGE_KEY = "sv_consent";
const CHANGE_EVENT = "sv:consent-change";
const OPEN_EVENT = "sv:consent-open";

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
  // when the choice was made (ISO date), for the record
  at: string;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

let cached: { raw: string | null; value: ConsentChoice | null } = { raw: null, value: null };

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === cached.raw) return cached.value;
  let value: ConsentChoice | null = null;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.analytics === "boolean" && typeof parsed.marketing === "boolean") {
      value = { analytics: parsed.analytics, marketing: parsed.marketing, at: String(parsed.at || "") };
    }
  } catch {
    value = null;
  }
  cached = { raw, value };
  return value;
}

// Google Consent Mode v2 values for a choice.
export function consentModeState(choice: Pick<ConsentChoice, "analytics" | "marketing"> | null) {
  const analytics = choice?.analytics ? "granted" : "denied";
  const marketing = choice?.marketing ? "granted" : "denied";
  return { analytics_storage: analytics, ad_storage: marketing, ad_user_data: marketing, ad_personalization: marketing };
}

export function saveConsent(choice: Pick<ConsentChoice, "analytics" | "marketing">): void {
  const value: ConsentChoice = { ...choice, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage blocked: the choice applies to this page view only
  }
  cached = { raw: null, value: null };
  try {
    window.gtag?.("consent", "update", consentModeState(value));
  } catch {}
  try {
    // a Pixel already running on this page stops (or resumes) sending
    window.fbq?.("consent", value.marketing ? "grant" : "revoke");
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Re-opens the banner (footer "Cookie settings").
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentOpen(listener: () => void): () => void {
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

// The current choice; null until the visitor has chosen (and always null during server rendering).
export function useConsent(): ConsentChoice | null {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}
