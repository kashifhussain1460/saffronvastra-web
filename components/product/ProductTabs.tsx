"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductReviews from "./ProductReviews";

export type PdpTab = "description" | "info" | "reviews" | "shipping";

export interface SpecRow {
  label: string;
  value: React.ReactNode;
}

interface ProductTabsProps {
  slug: string;
  description: string;
  careLines: string[];
  materialLines: string[];
  specs: SpecRow[];
  reviewCount: number;
  leadTime: string;
  shippingInfo?: string;
  activeTab: PdpTab;
  onTabChange: (t: PdpTab) => void;
}

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * Modave product tabs: centred underlined tab titles over a bordered, rounded panel.
 * The tab titles stay plain buttons (QA looks them up by role "button", e.g. "Reviews (n)").
 */
export default function ProductTabs({
  slug,
  description,
  careLines,
  materialLines,
  specs,
  reviewCount,
  leadTime,
  shippingInfo,
  activeTab,
  onTabChange,
}: ProductTabsProps) {
  // the reviews panel loads its data on first open and then stays mounted
  const [reviewsMounted, setReviewsMounted] = useState(activeTab === "reviews");
  useEffect(() => {
    if (activeTab === "reviews") setReviewsMounted(true);
  }, [activeTab]);

  const tabs: { id: PdpTab; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "info", label: "Additional Information" },
    { id: "reviews", label: `Reviews (${reviewCount})` },
    { id: "shipping", label: "Shipping & Returns" },
  ];

  const descParas = paragraphs(description);

  return (
    <div id="product-tabs" className="scroll-mt-28">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-7 sm:justify-center sm:gap-10" aria-label="Product information">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                id={`pdp-tab-${t.id}`}
                aria-controls={`pdp-panel-${t.id}`}
                aria-expanded={active}
                onClick={() => onTabChange(t.id)}
                className={`relative min-h-11 whitespace-nowrap pb-2 text-lg font-medium transition-colors sm:text-xl ${
                  active ? "text-ink" : "text-ink-secondary hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`absolute inset-x-0 bottom-1 h-px bg-primary transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line p-5 sm:p-8 lg:p-10">
        {/* Description */}
        <div id="pdp-panel-description" role="region" aria-labelledby="pdp-tab-description" hidden={activeTab !== "description"}>
          <div className={`grid gap-8 ${materialLines.length || careLines.length ? "md:grid-cols-2 md:gap-10" : ""}`}>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">About this piece</h3>
              {descParas.map((p, i) => (
                <p key={i} className="whitespace-pre-line text-base leading-relaxed text-ink-secondary">
                  {p}
                </p>
              ))}
            </div>
            {(materialLines.length > 0 || careLines.length > 0) && (
              <div className="space-y-6">
                {materialLines.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Material and craft</h3>
                    <ul className="space-y-2 text-base text-ink">
                      {materialLines.map((l) => (
                        <li key={l} className="flex gap-3">
                          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {careLines.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Care guidelines</h3>
                    <ul className="space-y-2 text-base text-ink">
                      {careLines.map((l) => (
                        <li key={l} className="flex gap-3">
                          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional information */}
        <div id="pdp-panel-info" role="region" aria-labelledby="pdp-tab-info" hidden={activeTab !== "info"}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <tbody>
                {specs.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-b-0">
                    <th scope="row" className="w-2/5 py-3 pr-4 align-top font-medium text-ink sm:w-1/4">
                      {row.label}
                    </th>
                    <td className="py-3 text-ink-secondary">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews */}
        <div id="pdp-panel-reviews" role="region" aria-labelledby="pdp-tab-reviews" hidden={activeTab !== "reviews"}>
          {reviewsMounted && <ProductReviews slug={slug} />}
        </div>

        {/* Shipping and returns (existing store copy) */}
        <div id="pdp-panel-shipping" role="region" aria-labelledby="pdp-tab-shipping" hidden={activeTab !== "shipping"}>
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Made-to-order shipping and timeline</h3>
              <p className="text-base leading-relaxed text-ink-secondary">
                Each jacket is individually crafted upon order placement. Please allow {leadTime} for hand-tailoring and
                inspection before dispatch.
              </p>
              {shippingInfo && <p className="text-base leading-relaxed text-ink-secondary">{shippingInfo}</p>}
              <p className="text-base leading-relaxed text-ink-secondary">
                Tracking number and photo updates provided once tailoring is complete.
              </p>
              <Link href="/policies/shipping" className="inline-block text-base text-ink underline underline-offset-4 hover:text-primary-hover">
                Shipping policy
              </Link>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Returns and exchanges</h3>
              <p className="text-base leading-relaxed text-ink-secondary">
                Easy returns (7 days): hassle-free size exchanges.
              </p>
              <Link href="/policies/returns" className="inline-block text-base text-ink underline underline-offset-4 hover:text-primary-hover">
                Returns policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
