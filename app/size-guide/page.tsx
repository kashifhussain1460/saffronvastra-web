import { BRAND } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import React from "react";
import Link from "next/link";
import { Scissors, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";

export const metadata = buildMetadata({
  title: "Unisex Size Guide & Measurement Guide",
  description:
    `Unisex size charts in inches and centimeters, custom measurement guidance, and fit recommendations for jackets and kimonos at ${BRAND.name}.`,
  path: "/size-guide",
});

export default function SizeGuidePage() {
  const sizeRows = [
    { size: "XS", chestIn: "32 – 34", chestCm: "81 – 86", waistIn: "26 – 28", waistCm: "66 – 71", hipIn: "34 – 36", hipCm: "86 – 91", lengthIn: "26.5", lengthCm: "67" },
    { size: "S", chestIn: "35 – 37", chestCm: "89 – 94", waistIn: "29 – 31", waistCm: "73 – 79", hipIn: "37 – 39", hipCm: "94 – 99", lengthIn: "27", lengthCm: "69" },
    { size: "M", chestIn: "38 – 40", chestCm: "96 – 101", waistIn: "32 – 34", waistCm: "81 – 86", hipIn: "40 – 42", hipCm: "101 – 107", lengthIn: "27.5", lengthCm: "70" },
    { size: "L", chestIn: "41 – 43", chestCm: "104 – 109", waistIn: "35 – 37", waistCm: "89 – 94", hipIn: "43 – 45", hipCm: "109 – 114", lengthIn: "28", lengthCm: "71" },
    { size: "XL", chestIn: "44 – 46", chestCm: "112 – 117", waistIn: "38 – 40", waistCm: "96 – 101", hipIn: "46 – 48", hipCm: "117 – 122", lengthIn: "28.5", lengthCm: "72" },
    { size: "XXL", chestIn: "47 – 50", chestCm: "119 – 127", waistIn: "41 – 44", waistCm: "104 – 112", hipIn: "49 – 52", hipCm: "124 – 132", lengthIn: "29", lengthCm: "74" },
    { size: "Free Size", chestIn: "36 – 44", chestCm: "91 – 112", waistIn: "30 – 38", waistCm: "76 – 96", hipIn: "38 – 46", hipCm: "96 – 117", lengthIn: "28", lengthCm: "71" },
  ];

  return (
    <div className="bg-canvas min-h-screen text-ink">
      <PageTitle
        title="Unisex Size & Measurement Guide"
        crumbs={[{ label: "Home", href: "/" }, { label: "Size Guide" }]}
      >
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
          Our jackets and kimonos are tailored with a relaxed, versatile unisex silhouette suitable for all genders. Select your standard size below or submit custom measurements during checkout.
        </p>
      </PageTitle>

      {/* Main Content Layout */}
      <section className="py-12 md:py-20 max-w-[1320px] mx-auto px-4 lg:px-[15px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[30px]">
          
          {/* Main Tables (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Standard Unisex Size Table */}
            <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-ink">
                    Unisex Body &amp; Garment Measurements
                  </h2>
                  <p className="text-sm text-ink-secondary mt-1">
                    Measurements refer to actual body and garment dimensions in inches and centimeters.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 bg-surface-muted text-ink text-xs font-medium rounded-full">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Custom Sizing Available</span>
                </span>
              </div>

              {/* Focusable so the table can be scrolled sideways with the keyboard on narrow screens. */}
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Size chart">
                <table className="w-full min-w-[540px] text-left text-sm border border-line">
                  <caption className="sr-only">Unisex Body &amp; Garment Measurements</caption>
                  <thead className="bg-surface-muted text-ink font-medium">
                    <tr>
                      <th scope="col" className="p-3 border-b border-line">Size</th>
                      <th scope="col" className="p-3 border-b border-line">Chest / Bust (In / Cm)</th>
                      <th scope="col" className="p-3 border-b border-line">Waist (In / Cm)</th>
                      <th scope="col" className="p-3 border-b border-line">Hips (In / Cm)</th>
                      <th scope="col" className="p-3 border-b border-line">Length (In / Cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sizeRows.map((row) => (
                      <tr key={row.size} className="hover:bg-surface-muted transition-colors">
                        <td className="p-3 font-medium text-ink">{row.size}</td>
                        <td className="p-3">{row.chestIn}&quot; / {row.chestCm} cm</td>
                        <td className="p-3">{row.waistIn}&quot; / {row.waistCm} cm</td>
                        <td className="p-3">{row.hipIn}&quot; / {row.hipCm} cm</td>
                        <td className="p-3">{row.lengthIn}&quot; / {row.lengthCm} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unisex Fit Guidance Card */}
            <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line space-y-4">
              <h3 className="text-xl font-medium text-ink">
                How Our Unisex Sizing Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ink-secondary">
                <div className="p-4 rounded-lg bg-surface-muted space-y-1">
                  <p className="font-semibold text-ink">For Men</p>
                  <p className="leading-relaxed">
                    Fits true to standard men&apos;s jacket sizes. If you prefer a slim, structured fit, consider ordering one size down.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-surface-muted space-y-1">
                  <p className="font-semibold text-ink">For Women</p>
                  <p className="leading-relaxed">
                    Features a modern, relaxed drape. Order your regular size for an easy, slightly oversized look, or size down for a tailored profile.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Measure Instructions */}
            <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line space-y-6">
              <h3 className="text-2xl font-medium text-ink">
                How to Take Accurate Measurements
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ink-secondary leading-relaxed">
                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">1. Chest / Bust</strong>
                  <p>Measure around the fullest part of your chest or bust, keeping the measuring tape comfortably snug and parallel to the floor.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">2. Natural Waist</strong>
                  <p>Wrap the tape around your natural waistline, approximately 1 inch above your navel. Breathe naturally without pulling the tape too tight.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">3. Fullest Hips</strong>
                  <p>Stand with feet together and measure around the widest point of your hips and seat, keeping the tape level all around.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">4. Garment Length</strong>
                  <p>For jackets and kimonos, measure from the high point of your shoulder seam near the collar down to your desired hemline.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Custom Sizing Advice (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Complimentary Custom Sizing Card */}
            <div className="bg-inverse text-on-primary p-8 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-highlight text-xs uppercase tracking-widest font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Free Custom Sizing</span>
              </div>
              <h4 className="text-2xl font-medium text-on-primary">
                Custom Tailored Fit
              </h4>
              <p className="text-sm text-on-inverse-muted leading-relaxed">
                Need extra sleeve length, broader shoulders, or custom dimensions? Enter your exact chest, waist, and length in the order notes during checkout. Our master tailors will customize your pattern at no extra cost.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/918209343979?text=Hello%20Saffron%20Vastra,%20I%20have%20a%20question%20regarding%20unisex%20garment%20sizing."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 px-6 bg-surface text-ink text-xs uppercase tracking-[0.08em] font-semibold hover:bg-primary-hover hover:text-on-primary transition-colors rounded-full"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Fit Consultation</span>
                </a>
              </div>
            </div>

            {/* Fit Guarantee Card */}
            <div className="bg-surface-muted p-6 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-ink text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>7-Day Fit Guarantee</span>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed">
                If your finished made-to-order garment requires minor adjustments upon arrival, we offer one round of free alterations with free doorstep pickup across India.
              </p>
              <Link
                href="/policies/returns"
                className="text-sm font-medium text-ink hover:text-primary-hover underline underline-offset-4 block pt-1"
              >
                Read Alterations Policy &rarr;
              </Link>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
