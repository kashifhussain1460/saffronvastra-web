// Shared types and helpers for the admin Sales, Discounts and Email campaign screens.

export type SaleState = "Draft" | "Scheduled" | "Live" | "Paused" | "Expired" | "Ended";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type Segment = "FAVOURITE" | "CART" | "BOTH";
export type EmailStatus = "Draft" | "Scheduled" | "Sending" | "Completed" | "Cancelled";

export interface Sale {
  id: string;
  name: string;
  description: string | null;
  badgeText: string | null;
  discountType: DiscountType;
  value: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  status: "Draft" | "Active" | "Paused" | "Ended";
  state: SaleState;
  allowCouponStacking: boolean;
  version: number;
  productCount: number;
  activatedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  discountCampaignId: string | null;
  discountCampaign: { id: string; name: string; status: string; startsAt: string; endsAt: string } | null;
  name: string;
  subject: string;
  preheader: string | null;
  headline: string | null;
  intro: string | null;
  segment: Segment;
  status: EmailStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string;
  opened?: number;
  clicked?: number;
  unsubscribed?: number;
  orders?: number;
  revenue?: number;
}

export const inr = (n: number | null | undefined) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const discountLabel = (s: Pick<Sale, "discountType" | "value" | "maxDiscount">) =>
  s.discountType === "PERCENTAGE" ? `${s.value}% off${s.maxDiscount ? ` (max ${inr(s.maxDiscount)})` : ""}` : `${inr(s.value)} off`;

export const SEGMENT_LABELS: Record<Segment, string> = {
  FAVOURITE: "Favourited the piece",
  CART: "Has the piece in their bag",
  BOTH: "Favourites or bag",
};

const BADGE = {
  green: "bg-success-bg border-success-line text-success",
  blue: "bg-info-bg border-info-line text-info",
  amber: "bg-warning-bg border-warning-line text-warning",
  red: "bg-error-bg border-error-line text-error",
  grey: "bg-surface-muted border-line text-ink-secondary",
};

export const SALE_STATE_STYLE: Record<SaleState, string> = {
  Live: BADGE.green,
  Scheduled: BADGE.blue,
  Paused: BADGE.amber,
  Draft: BADGE.grey,
  Expired: BADGE.amber,
  Ended: BADGE.grey,
};

export const EMAIL_STATUS_STYLE: Record<string, string> = {
  Draft: BADGE.grey,
  Scheduled: BADGE.blue,
  Sending: BADGE.amber,
  Completed: BADGE.green,
  Cancelled: BADGE.red,
  Pending: BADGE.grey,
  Sent: BADGE.green,
  Failed: BADGE.red,
  Skipped: BADGE.amber,
};

export const badgeClass = "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold";
export const fieldClass = "w-full px-3 py-2 bg-surface border border-line rounded-md text-xs focus:outline-none focus:border-primary";
export const btnPrimary =
  "inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold hover:bg-ink/5 disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-error-line text-error rounded-md text-xs font-semibold hover:bg-error-bg disabled:opacity-50";

/** <input type="datetime-local"> works in local time without a zone. */
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : "");

export const pct = (n: number | undefined) => `${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
