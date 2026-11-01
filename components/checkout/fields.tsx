import React from "react";

/** Form control look: 48px, 2px light border, 8px radius, dark border on focus, red on error. */
export const fieldClass = (hasError?: boolean, isTouchedValid?: boolean) =>
  `w-full h-12 bg-surface border-2 rounded-lg px-4 text-base text-ink placeholder:text-ink-muted focus:outline-none transition-colors ${
    hasError
      ? "border-error focus:border-error bg-error-bg/10"
      : isTouchedValid
      ? "border-line focus:border-ink"
      : "border-line focus:border-ink"
  }`;

export function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
      {children}
      {optional ? (
        <span className="text-ink-muted font-normal"> (Optional)</span>
      ) : (
        <span className="text-error font-bold" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-error mt-1.5 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-error inline-block shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
