import { MAX_UPLOAD_BYTES } from "@/lib/uploadLimits";
// Shared types and wording for the customer's payment and request screens.

export type RequestType = "CANCELLATION" | "RETURN" | "EXCHANGE";

export interface OrderRequestData {
  id: string;
  requestNumber: string;
  type: RequestType;
  status: string;
  reasonCode: string;
  details?: string | null;
  resolution?: "REFUND" | "EXCHANGE" | "NONE" | string;
  outsideWindow?: boolean;
  returnShippingPayer?: "CUSTOMER" | "SELLER" | null;
  evidence?: string[];
  decisionNote?: string | null;
  createdAt: string;
  items: { orderItemId: string; quantity: number; exchangeSize?: string | null }[];
  events?: { fromStatus: string | null; toStatus: string; actorRole: string; note?: string | null; createdAt: string }[];
}

export interface PaymentRefund {
  id: string;
  amountMinor: number;
  status: string;
  method?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface OrderPayment {
  id: string;
  provider: string;
  status: string;
  amountMinor: number;
  paidAt?: string | null;
  failureReason?: string | null;
  refunds: PaymentRefund[];
}

export const REASON_LABELS: Record<string, string> = {
  CHANGE_OF_MIND: "I changed my mind",
  SIZE_ISSUE: "The size does not fit",
  DEFECTIVE: "The product is defective",
  DAMAGED: "The product arrived damaged",
  INCORRECT: "I received the wrong product",
  NOT_AS_DESCRIBED: "It is not as described",
  OTHER: "Another reason",
};

/** These reasons always need a written description of 10 or more characters. */
export const DETAILS_REQUIRED = new Set(["DEFECTIVE", "DAMAGED", "INCORRECT", "NOT_AS_DESCRIBED", "OTHER"]);
/** These stay open after the 7-day return window (reviewed individually). */
export const REMEDY_REASONS = new Set(["DEFECTIVE", "DAMAGED", "INCORRECT", "NOT_AS_DESCRIBED"]);

export const TYPE_LABELS: Record<RequestType, string> = {
  CANCELLATION: "Cancellation",
  RETURN: "Return for refund",
  EXCHANGE: "Exchange for another size",
};

export const MIN_DETAILS = 10;
export const MAX_DETAILS = 1000;
export const MAX_PHOTOS = 5;
// 5 MB, or the smaller upload limit of the host (see lib/uploadLimits.ts)
export const MAX_PHOTO_BYTES = Math.min(5 * 1024 * 1024, MAX_UPLOAD_BYTES);
export const MAX_PHOTO_LABEL = `${Math.round(MAX_PHOTO_BYTES / (1024 * 1024))} MB`;

export const formatMinor = (minor: number) => `₹${((minor || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDay = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

/** Status chip tone from the status tokens. Text always carries the meaning; colour only supports it. */
export function toneClass(tone: "success" | "warning" | "error" | "info" | "neutral") {
  switch (tone) {
    case "success":
      return "bg-success-bg text-success border-success-line";
    case "warning":
      return "bg-warning-bg text-warning border-warning-line";
    case "error":
      return "bg-error-bg text-error border-error-line";
    case "info":
      return "bg-info-bg text-info border-info-line";
    default:
      return "bg-surface-muted text-ink-secondary border-line";
  }
}

export function requestTone(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  if (status === "Completed" || status === "Approved") return "success";
  if (status === "Rejected") return "error";
  if (status === "Received") return "info";
  if (status === "Cancelled") return "neutral";
  return "warning";
}

export const REQUEST_STATUS_TEXT: Record<string, string> = {
  Requested: "Requested, waiting for our review",
  Approved: "Approved",
  Rejected: "Not approved",
  Cancelled: "Withdrawn or cancelled",
  Received: "Items received",
  Completed: "Completed",
};

export function paymentTone(paymentStatus: string): "success" | "warning" | "error" | "info" | "neutral" {
  if (paymentStatus === "Paid") return "success";
  if (paymentStatus === "Failed") return "error";
  if (paymentStatus === "Refunded" || paymentStatus === "Partially Refunded") return "info";
  return "warning";
}

export const providerLabel = (provider: string) =>
  provider === "COD" ? "Cash on Delivery" : provider === "CASHFREE" ? "Online payment" : provider || "Not recorded";

export const isOpenRequest = (r: OrderRequestData) => r.status === "Requested" || r.status === "Approved" || r.status === "Received";

export async function apiJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...init });
  const body = await res.json().catch(() => null);
  return { res, body };
}
