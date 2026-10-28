// Shared Modave-style form classes for the sign-in, registration and account pages.
// Inputs: 48px tall, 8px radius, 2px line border; buttons: 48px pill, dark fill, red on hover.

export const inputBase =
  "block w-full h-12 rounded-lg border-2 bg-surface px-4 text-base text-ink placeholder:text-ink-muted outline-none transition-colors disabled:opacity-60 read-only:bg-surface-muted";

export const inputClass = (invalid = false) =>
  `${inputBase} ${invalid ? "border-error focus:border-error" : "border-line focus:border-ink"}`;

export const textareaClass =
  "block w-full rounded-lg border-2 border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-ink resize-none";

export const labelClass = "block mb-2 text-sm font-medium text-ink";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full border border-primary bg-primary text-on-primary text-base font-semibold transition-colors hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:pointer-events-none";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full border border-ink bg-surface text-ink text-base font-semibold transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-50 disabled:pointer-events-none";

/** Small square-cornered dark button used in tables (Modave "View" / "Edit" buttons). */
export const btnSmall =
  "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 rounded bg-primary text-on-primary text-sm font-semibold transition-colors hover:bg-primary-hover disabled:opacity-50";

export const btnSmallOutline =
  "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 rounded border border-line-strong bg-surface text-ink text-sm font-semibold transition-colors hover:border-primary-hover hover:text-primary-hover disabled:opacity-50";

export const errorText = "mt-1.5 text-sm text-error";

export const sectionTitle = "font-heading text-2xl font-medium text-ink";
