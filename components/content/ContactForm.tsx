"use client";

import { BRAND } from "@/lib/brand";
import React, { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const INQUIRY_LABELS: Record<string, string> = {
  sizing: "Custom Made-to-Order Sizing & Tailoring",
  tracking: "Order Production Status & Tracking",
  bridal: "Bespoke Bridal & Heirloom Commission",
  care: "Garment Care, Silk Velvet & Storage",
  press: "Press, Editorial & Collaborations",
  other: "General Assistance",
};

type Field = "name" | "email" | "phone" | "orderId" | "message";
type Errors = Partial<Record<Field, string>>;

const EMPTY = { name: "", email: "", phone: "", orderId: "", inquiryType: "sizing", message: "" };

// Same rules as the contact API, so most mistakes are caught before the request is sent.
function validate(f: typeof EMPTY): Errors {
  const e: Errors = {};
  const name = f.name.trim();
  const email = f.email.trim();
  const message = f.message.trim();
  if (!name) e.name = "Name is required";
  else if (name.length > 100) e.name = "Name must be 100 characters or fewer";
  if (!email) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
  if (f.phone.trim() && !/^[0-9+()\-\s]{7,20}$/.test(f.phone.trim())) e.phone = "Enter a valid phone number";
  if (f.orderId.trim() && !/^[A-Za-z0-9-]{1,40}$/.test(f.orderId.trim())) e.orderId = "Order number is not valid";
  if (!message) e.message = "Message is required";
  else if (message.length < 10) e.message = "Message must be at least 10 characters";
  else if (message.length > 2000) e.message = "Message must be 2000 characters or fewer";
  return e;
}

// API field names -> form field names
const API_FIELD: Record<string, Field> = { name: "name", email: "email", phone: "phone", orderNumber: "orderId", message: "message" };
const ORDER: Field[] = ["name", "email", "phone", "orderId", "message"];

const inputBase =
  "w-full px-4 bg-surface border rounded-lg text-base text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-ink";
const labelClass = "block text-sm font-medium text-ink mb-1.5";

export default function ContactForm() {
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const refs = useRef<Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((f) => ({ ...f, [k]: e.target.value }));
    if (k in errors) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const focusFirst = (errs: Errors) => {
    const first = ORDER.find((f) => errs[f]);
    if (first) refs.current[first]?.focus();
  };

  // The message is sent to the API; the thank-you screen shows only after the server saved it.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setSubmitError("");
    const clientErrors = validate(formData);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      focusFirst(clientErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          orderNumber: formData.orderId || undefined,
          subject: INQUIRY_LABELS[formData.inquiryType] || undefined,
          message: formData.message,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const serverErrors: Errors = {};
        if (res.status === 400 && body?.errors && typeof body.errors === "object") {
          for (const [k, v] of Object.entries(body.errors as Record<string, string[]>)) {
            const field = API_FIELD[k];
            if (field && Array.isArray(v) && v[0]) serverErrors[field] = v[0];
          }
        }
        if (Object.keys(serverErrors).length) {
          setErrors(serverErrors);
          focusFirst(serverErrors);
        } else {
          setSubmitError(body?.message || "We could not send your message. Please try again.");
        }
        return;
      }
      setSubmitted(true);
      setErrors({});
      setFormData(EMPTY);
    } catch {
      setSubmitError("Network error: your message was not sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div role="status" className="border border-line rounded-2xl p-6 md:p-10 text-center space-y-4">
        <CheckCircle2 aria-hidden="true" className="w-12 h-12 mx-auto text-success" strokeWidth={1.5} />
        <h3 className="text-2xl font-medium text-ink">Inquiry Received with Gratitude</h3>
        <p className="text-sm md:text-base text-ink-secondary max-w-md mx-auto leading-[26px]">
          Thank you for reaching out to {BRAND.name}. Your message has been routed to our Jaipur atelier concierge. We look forward to assisting you.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  const fieldProps = (k: Field) => ({
    id: k,
    ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      refs.current[k] = el;
    },
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
    className: `${inputBase} ${errors[k] ? "border-error" : "border-line-strong"}`,
  });

  const errorText = (k: Field) =>
    errors[k] ? (
      <p id={`${k}-error`} role="alert" className="mt-1.5 text-sm text-error">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name *
          </label>
          <input
            {...fieldProps("name")}
            type="text"
            autoComplete="name"
            aria-required="true"
            placeholder="e.g. Meera Kapoor"
            value={formData.name}
            onChange={set("name")}
            className={`${fieldProps("name").className} h-12`}
          />
          {errorText("name")}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address *
          </label>
          <input
            {...fieldProps("email")}
            type="email"
            autoComplete="email"
            aria-required="true"
            placeholder="e.g. meera@example.com"
            value={formData.email}
            onChange={set("email")}
            className={`${fieldProps("email").className} h-12`}
          />
          {errorText("email")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone / WhatsApp Number
          </label>
          <input
            {...fieldProps("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={set("phone")}
            className={`${fieldProps("phone").className} h-12`}
          />
          {errorText("phone")}
        </div>
        <div>
          <label htmlFor="orderId" className={labelClass}>
            Order ID (If Applicable)
          </label>
          <input
            {...fieldProps("orderId")}
            type="text"
            placeholder="e.g. ORD-2026-8941"
            value={formData.orderId}
            onChange={set("orderId")}
            className={`${fieldProps("orderId").className} h-12`}
          />
          {errorText("orderId")}
        </div>
      </div>

      <div>
        <label htmlFor="inquiryType" className={labelClass}>
          Nature of Inquiry *
        </label>
        <select
          id="inquiryType"
          value={formData.inquiryType}
          onChange={set("inquiryType")}
          className={`${inputBase} border-line-strong h-12`}
        >
          {Object.entries(INQUIRY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message / Custom Specifications *
        </label>
        <textarea
          {...fieldProps("message")}
          aria-required="true"
          rows={6}
          placeholder="Please describe your styling requirements, custom dimensions, or any specific questions..."
          value={formData.message}
          onChange={set("message")}
          className={`${fieldProps("message").className} py-3 min-h-[160px] resize-y`}
        />
        {errorText("message")}
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-error bg-error-bg border border-error-line rounded-lg px-4 py-3">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors disabled:opacity-70"
      >
        {loading ? "Submitting Message..." : "Send Concierge Message"}
      </button>
    </form>
  );
}
