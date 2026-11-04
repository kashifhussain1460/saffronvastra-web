// Post-sign-in destinations come from the ?redirect= query, so they are untrusted input.
// Only a same-origin relative path is accepted; anything else falls back to the caller's default.
// Browsers treat "\" like "/" and drop tabs and newlines, so "/\evil.com" and "/<TAB>/evil.com"
// would otherwise leave the site even though they start with a single "/".

const BASE = "https://same-origin.invalid";
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function isUnsafe(path: string): boolean {
  return (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    CONTROL_CHARS.test(path) ||
    SCHEME.test(path)
  );
}

export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string" || value === "") return fallback;
  if (isUnsafe(value)) return fallback;

  // The same checks once more after one round of percent-decoding (e.g. "/%5Cevil.example").
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (isUnsafe(decoded)) return fallback;

  // Finally, the browser's own resolution must stay on this origin.
  try {
    if (new URL(value, BASE).origin !== BASE) return fallback;
  } catch {
    return fallback;
  }
  return value;
}
