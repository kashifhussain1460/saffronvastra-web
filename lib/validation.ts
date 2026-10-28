// Field rules shared by the storefront forms. They mirror the API (backend/src/common/validators.ts and the auth
// schemas) so a shopper sees the same answer immediately that the server would give.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Keeps only the 10 national digits of an Indian mobile number (drops spaces, dashes, +91, 91 or a leading 0). */
export function nationalMobileDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^(91|0)(?=\d{10}$)/, "").slice(0, 10);
}

export function mobileError(value: string): string | null {
  const digits = nationalMobileDigits(value);
  if (!digits) return "Mobile number is required";
  if (digits.length < 10) return "Enter all 10 digits of your mobile number";
  if (!/^[6-9]/.test(digits)) return "Indian mobile numbers start with 6, 7, 8 or 9";
  return null;
}

export function nameError(value: string): string | null {
  const v = value.trim();
  if (!v) return "Full name is required";
  if (v.length < 2) return "Name must be at least 2 characters";
  if (v.length > 100) return "Name must be 100 characters or fewer";
  if (!/^[\p{L}][\p{L}\p{M}' .-]*$/u.test(v)) return "Use letters, spaces, apostrophes, dots or hyphens only";
  return null;
}

export function emailError(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email address is required";
  if (v.length > 254) return "Email address is too long";
  if (!EMAIL_PATTERN.test(v)) return "Enter a valid email address, for example name@example.com";
  return null;
}

export function passwordError(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Use at least 8 characters";
  if (value.length > 128) return "Use 128 characters or fewer";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Use at least one letter and one number";
  return null;
}

/** 0-4: length, upper case, digit, symbol. */
export function passwordStrength(value: string): number {
  if (!value) return 0;
  return [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
}
