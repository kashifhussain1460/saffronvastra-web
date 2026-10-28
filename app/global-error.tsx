"use client";

import { BRAND } from "@/lib/brand";
// Last resort when the root layout itself fails: it must render its own <html> and use inline styles only.
// Colours read the tokens from app/globals.css when the stylesheet is available; the fallbacks are the same values.
const c = (token: string, fallback: string) => `rgb(var(--color-${token}, ${fallback}))`;
const ink = c("ink", "24 24 24");
const primary = c("primary", "24 24 24");

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: c("canvas", "255 255 255"), color: ink, fontFamily: "'Kumbh Sans', system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <p style={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: ink }}>{BRAND.name}</p>
            <h1 style={{ fontSize: 34, fontWeight: 500, margin: "12px 0" }}>We are having trouble right now</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: c("ink-secondary", "77 78 79") }}>
              The site could not load. Please try again in a moment.
            </p>
            {error.digest && <p style={{ fontSize: 11, color: c("ink-muted", "107 107 107") }}>Reference: {error.digest}</p>}
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: 16, padding: "12px 28px", background: primary, color: c("on-primary", "255 255 255"), border: 0, borderRadius: 28, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
            <p style={{ marginTop: 16 }}>
              <a href="/" style={{ color: primary, fontSize: 13 }}>Go to the home page</a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
