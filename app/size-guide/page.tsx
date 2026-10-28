import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import { Scissors, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";

export const metadata = {
  title: `Atelier Size Guide & Measuring Guide | ${BRAND.name}`,
  description:
    `Size charts in inches and centimeters, bespoke custom measurement guidance, and fit recommendations for ${BRAND.name}.`,
};

export default function SizeGuidePage() {
  const sizeRows = [
    { size: "XS", bustIn: "32 – 33", bustCm: "81 – 84", waistIn: "25 – 26", waistCm: "63 – 66", hipIn: "35 – 36", hipCm: "89 – 91" },
    { size: "S", bustIn: "34 – 35", bustCm: "86 – 89", waistIn: "27 – 28", waistCm: "68 – 71", hipIn: "37 – 38", hipCm: "94 – 96" },
    { size: "M", bustIn: "36 – 37", bustCm: "91 – 94", waistIn: "29 – 30", waistCm: "73 – 76", hipIn: "39 – 40", hipCm: "99 – 101" },
    { size: "L", bustIn: "38 – 40", bustCm: "96 – 101", waistIn: "31 – 33", waistCm: "78 – 84", hipIn: "41 – 43", hipCm: "104 – 109" },
    { size: "XL", bustIn: "41 – 43", bustCm: "104 – 109", waistIn: "34 – 36", waistCm: "86 – 91", hipIn: "44 – 46", hipCm: "112 – 117" },
    { size: "XXL", bustIn: "44 – 46", bustCm: "112 – 117", waistIn: "37 – 39", waistCm: "94 – 99", hipIn: "47 – 49", hipCm: "119 – 124" },
  ];

  return (
    <div className="bg-canvas min-h-screen text-ink">
      <PageTitle
        title="Atelier Sizing & Measurement Guide"
        crumbs={[{ label: "Home", href: "/" }, { label: "Size Guide" }]}
      >
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
          Every garment is tailored individually in Jaipur. Select your standard size below or submit your exact custom measurements for bespoke atelier tailoring.
        </p>
      </PageTitle>

      {/* Main Content Layout */}
      <section className="py-12 md:py-20 max-w-[1320px] mx-auto px-4 lg:px-[15px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[30px]">
          
          {/* Main Tables (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Standard Size Table */}
            <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-ink">
                    Standard Women&apos;s Body Measurements
                  </h2>
                  <p className="text-sm text-ink-secondary mt-1">
                    Measurements refer to actual body dimensions in inches and centimeters.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 bg-surface-muted text-ink text-xs font-medium rounded-full">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Custom Sizing Available</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm border border-line">
                  <thead className="bg-surface-muted text-ink font-medium">
                    <tr>
                      <th className="p-3 border-b border-line">Size</th>
                      <th className="p-3 border-b border-line">Bust (In / Cm)</th>
                      <th className="p-3 border-b border-line">Waist (In / Cm)</th>
                      <th className="p-3 border-b border-line">Hips (In / Cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sizeRows.map((row) => (
                      <tr key={row.size} className="hover:bg-surface-muted transition-colors">
                        <td className="p-3 font-medium text-ink">{row.size}</td>
                        <td className="p-3">{row.bustIn}&quot; / {row.bustCm} cm</td>
                        <td className="p-3">{row.waistIn}&quot; / {row.waistCm} cm</td>
                        <td className="p-3">{row.hipIn}&quot; / {row.hipCm} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to Measure Instructions */}
            <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line space-y-6">
              <h3 className="text-2xl font-medium text-ink">
                How to Take Accurate Measurements
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ink-secondary leading-relaxed">
                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">1. Bust / Chest</strong>
                  <p>Measure across the fullest part of your bust while wearing your everyday undergarments. Keep the tape comfortably snug and parallel to the floor.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">2. Natural Waist</strong>
                  <p>Wrap the tape around your natural waistline, approximately 1 inch above your belly button. Do not suck in your stomach; breathe naturally.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">3. Fullest Hips</strong>
                  <p>Stand with feet together and measure around the widest point of your hips and buttocks, keeping the tape level all around.</p>
                </div>

                <div className="p-5 bg-surface-muted rounded-xl space-y-1.5">
                  <strong className="block text-ink font-medium text-base">4. Garment Length</strong>
                  <p>For jackets and kimonos, measure from the highest point of your shoulder seam near the collarbone down to your desired hemline.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Bespoke Sizing Advice (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Complimentary Custom Sizing Card */}
            <div className="bg-inverse text-on-primary p-8 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-highlight text-xs uppercase tracking-widest font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Complimentary Service</span>
              </div>
              <h4 className="text-2xl font-medium text-on-primary">
                Bespoke Custom Fit
              </h4>
              <p className="text-sm text-on-inverse-muted leading-relaxed">
                Do your proportions fall between sizes or do you prefer extra sleeve length? Enter your exact bust, waist, and hip dimensions in the order notes during checkout, and our master tailors will draft your pattern from scratch at zero additional charge.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/919829014820?text=Hello%20Saffron%20Threads,%20I%20have%20a%20question%20regarding%20custom%20garment%20sizing."
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
                If your finished made-to-order garment requires minor adjustments upon arrival, we offer one round of complimentary atelier alterations with free doorstep pickup across India.
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
