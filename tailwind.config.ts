import type { Config } from "tailwindcss";

// Every colour comes from a CSS variable in app/globals.css (the single source of truth).
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          rust: token("brand-rust"),
          saffron: token("brand-saffron"),
          gold: token("brand-gold"),
          bronze: token("brand-bronze"),
          cream: token("brand-cream"),
        },
        primary: { DEFAULT: token("primary"), hover: token("primary-hover") },
        secondary: token("secondary"),
        accent: token("accent"),
        highlight: token("highlight"),
        canvas: token("canvas"),
        surface: { DEFAULT: token("surface"), muted: token("surface-muted") },
        ink: { DEFAULT: token("ink"), secondary: token("ink-secondary"), muted: token("ink-muted") },
        line: { DEFAULT: token("line"), strong: token("line-strong") },
        inverse: { DEFAULT: token("inverse"), hover: token("inverse-hover"), line: token("inverse-line") },
        on: { primary: token("on-primary"), inverse: token("on-inverse"), "inverse-muted": token("on-inverse-muted") },
        focus: token("focus"),
        success: { DEFAULT: token("success"), bg: token("success-bg"), line: token("success-line") },
        warning: { DEFAULT: token("warning"), bg: token("warning-bg"), line: token("warning-line") },
        error: { DEFAULT: token("error"), bg: token("error-bg"), line: token("error-line") },
        info: { DEFAULT: token("info"), bg: token("info-bg"), line: token("info-line") },
      },
      fontFamily: {
        // font-serif is kept as an alias so existing heading classes follow the Modave heading font
        serif: ["var(--font-body)", "Kumbh Sans", "system-ui", "sans-serif"],
        heading: ["var(--font-body)", "Kumbh Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "Kumbh Sans", "system-ui", "sans-serif"],
        accent: ["var(--font-accent)", "Instrument Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        arch: "140px 140px 0 0",
        "arch-sm": "90px 90px 0 0",
        "arch-lg": "180px 180px 0 0",
      },
      boxShadow: {
        luxury: "0 10px 30px -10px rgb(var(--color-ink) / 0.08)",
        card: "0 4px 20px -2px rgb(var(--color-ink) / 0.06)",
        drawer: "-8px 0 30px rgb(var(--color-ink) / 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
