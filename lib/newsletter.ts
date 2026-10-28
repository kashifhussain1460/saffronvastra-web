export interface NewsletterResult {
  ok: boolean;
  message: string;
}

// Sends the sign-up to the API. "ok" is true only when the server accepted it, so a form
// never shows a welcome message for an address that was not saved.
export async function subscribeToNewsletter(email: string, source: string): Promise<NewsletterResult> {
  try {
    const res = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), source }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, message: body?.message || "You are subscribed." };
    return { ok: false, message: body?.message || "We could not complete your sign-up. Please try again." };
  } catch {
    return { ok: false, message: "Network error: you were not subscribed. Please try again." };
  }
}
