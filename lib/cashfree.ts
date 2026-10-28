// Opens Cashfree's hosted checkout. The browser only ever receives a one-time payment_session_id created by our API;
// the secret key stays on the server. The SDK is loaded from Cashfree's own address when it is needed.

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }) => Promise<unknown> | void;
    };
  }
}

let loading: Promise<void> | null = null;

export function loadCashfreeSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Cashfree can only be opened in the browser"));
  if (window.Cashfree) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => (window.Cashfree ? resolve() : reject(new Error("The payment window did not load")));
    script.onerror = () => {
      loading = null;
      reject(new Error("The payment window could not be loaded. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Sends the customer to Cashfree to pay. Resolves only if the page is still here (it normally redirects away). */
export async function openCashfreeCheckout(paymentSessionId: string, mode: "sandbox" | "production") {
  await loadCashfreeSdk();
  const cashfree = window.Cashfree!({ mode });
  await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
}
