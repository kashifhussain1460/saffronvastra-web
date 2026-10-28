import React from "react";
import Link from "next/link";
import { btnSmall } from "@/components/auth/ui";

export interface OrderRow {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
}

/** Order status as a small tinted label; colours come from the status tokens. */
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Delivered"
      ? "bg-success-bg text-success border-success-line"
      : status === "Cancelled" || status === "Returned" || status === "Refunded"
      ? "bg-error-bg text-error border-error-line"
      : status === "Shipped" || status === "Out for Delivery"
      ? "bg-info-bg text-info border-info-line"
      : "bg-warning-bg text-warning border-warning-line";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded px-2.5 py-0.5 text-sm font-medium border ${tone}`}>
      {status || "Unknown"}
    </span>
  );
}

/** Modave "Your Orders" table: Order, Date, Status, Total, Actions. Scrolls sideways on narrow screens. */
export default function OrdersTable({ rows, caption }: { rows: OrderRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto border border-line rounded-lg">
      <table className="w-full min-w-[640px] text-left text-base text-ink">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-muted">
          <tr>
            <th scope="col" className="px-5 py-4 font-semibold">Order</th>
            <th scope="col" className="px-5 py-4 font-semibold">Date</th>
            <th scope="col" className="px-5 py-4 font-semibold">Status</th>
            <th scope="col" className="px-5 py-4 font-semibold">Total</th>
            <th scope="col" className="px-5 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((o) => (
            <tr key={o.id}>
              <td className="px-5 py-4 font-medium whitespace-nowrap">#{o.orderNumber}</td>
              <td className="px-5 py-4 whitespace-nowrap">{o.date}</td>
              <td className="px-5 py-4">
                <StatusBadge status={o.status} />
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                ₹{o.total.toLocaleString("en-IN")} for {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
              </td>
              <td className="px-5 py-3">
                <Link
                  href={`/account/orders/${o.orderNumber}`}
                  className={btnSmall}
                  aria-label={`View order ${o.orderNumber}`}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
