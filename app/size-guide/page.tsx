import { BRAND } from "@/lib/brand";
import MeasurementsTable from "@/components/product/MeasurementsTable";
import { STANDARD_JACKET, STANDARD_LONG_KIMONO, STANDARD_NOTE, STANDARD_VEST } from "@/lib/sizeChart";
import { buildMetadata } from "@/lib/seo";
import React from "react";
import Link from "next/link";
import { Scissors, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";

export const metadata = buildMetadata({
  title: "Unisex Size Guide & Measurement Guide",
  description:
    `Unisex Indian size chart (S, M, L, XL, Free Size) in inches and centimetres, how to measure, and fit tips for ${BRAND.displayName} jackets and kimonos.`,
  path: "/size-guide",
});

export default function SizeGuidePage() {
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
                    Unisex Size Chart (Indian Sizes)
                  </h2>
                  <p className="text-sm text-ink-secondary mt-1">
                    &quot;Fits chest&quot; is your body measurement; the other columns are the finished garment, in inches or centimetres.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 bg-surface-muted text-ink text-xs font-medium rounded-full">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Custom Sizing Available</span>
                </span>
              </div>

              <MeasurementsTable rows={STANDARD_JACKET.rows} caption="Jackets (Suzani jackets and short kimono jackets)" />
              <MeasurementsTable rows={STANDARD_LONG_KIMONO.rows} caption="Long kimono jackets (open front, relaxed fit)" />
              <MeasurementsTable rows={STANDARD_VEST.rows} caption="Vests and waistcoats (sleeveless)" />
              <p className="text-xs leading-relaxed text-ink-secondary">
                {STANDARD_NOTE} Each product page shows the measurements for that piece under &quot;Size Guide&quot;.
              </p>
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
                  <strong className="block text-ink font-medium text-base">2. Shoulder</strong>
                  <p>Measure across your back from the edge of one shoulder to the other, where a shirt&apos;s shoulder seam would sit.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">3. Sleeve</strong>
                  <p>Measure from the shoulder edge, over a slightly bent elbow, down to where you want the cuff to end.</p>
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
                Need extra sleeve length, broader shoulders, or custom dimensions? Enter your exact chest, shoulder, sleeve and length in the order notes during checkout. Our master tailors will customize your pattern at no extra cost.
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
