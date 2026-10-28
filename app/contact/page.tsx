"use client";

import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";
import PageTitle from "@/components/checkout/PageTitle";
import ContactForm from "@/components/content/ContactForm";

const infoLabel = "text-base font-medium text-ink mb-1.5";
const infoText = "text-base leading-[26px] text-ink-secondary";
const infoLink = "hover:text-primary-hover underline-offset-4 hover:underline inline-block py-2.5 -my-2.5 md:py-0 md:my-0";

export default function ContactPage() {
  const { store: storeInfo } = useSiteSettings();

  return (
    <div className="bg-canvas text-ink">
      <PageTitle title="Contact Us" crumbs={[{ label: "Home", href: "/" }, { label: "Atelier Concierge & Contact" }]}>
        <p className="mt-3 text-sm md:text-base text-ink-secondary max-w-2xl mx-auto">
          Our atelier concierge team in Jaipur is available to assist with custom sizing, order updates, private commissions, and garment care inquiries.
        </p>
      </PageTitle>

      <section className="py-10 md:py-20">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-[60px]">
          {/* Form */}
          <div className="lg:col-span-8 min-w-0">
            <h2 className="text-2xl leading-[34px] md:text-[30px] md:leading-[42px] font-medium text-ink">At Your Bespoke Service</h2>
            <p className="mt-2 mb-6 text-base leading-[26px] text-ink-muted">
              Please complete the details below. Our client advisor will reply within 24 business hours.
            </p>
            <ContactForm />
          </div>

          {/* Information */}
          <div className="lg:col-span-4 min-w-0">
            <h2 className="text-2xl leading-[34px] md:text-[30px] md:leading-[42px] font-medium text-ink mb-6 md:mb-8">Information</h2>

            <dl className="space-y-6">
              <div>
                <dt className={infoLabel}>Phone:</dt>
                <dd className={infoText}>
                  <p>
                    Hotline:{" "}
                    <a href={`tel:${storeInfo.supportPhone.replace(/[^0-9+]/g, "")}`} className={infoLink}>
                      {storeInfo.supportPhone}
                    </a>
                  </p>
                  <p>
                    WhatsApp:{" "}
                    <a href="https://wa.me/919829014820" target="_blank" rel="noreferrer" className={infoLink}>
                      +91 98290 14820
                    </a>
                  </p>
                </dd>
              </div>

              <div>
                <dt className={infoLabel}>Email:</dt>
                <dd className={infoText}>
                  <p>
                    Client Concierge:{" "}
                    <a href={`mailto:${storeInfo.supportEmail}`} className={`${infoLink} break-all`}>
                      {storeInfo.supportEmail}
                    </a>
                  </p>
                  <p>
                    Press &amp; Collaborations:{" "}
                    <a href={`mailto:atelier@${BRAND.domain}`} className={`${infoLink} break-all`}>
                      atelier@{BRAND.domain}
                    </a>
                  </p>
                </dd>
              </div>

              <div>
                <dt className={infoLabel}>Address:</dt>
                <dd className={infoText}>{storeInfo.address}</dd>
              </div>

              <div>
                <dt className={infoLabel}>Atelier Hours (IST):</dt>
                <dd className={infoText}>
                  <p>Monday to Saturday: 10:00 AM – 7:00 PM IST</p>
                  <p>Sunday: Reserved for Private Commissions</p>
                </dd>
              </div>
            </dl>

            {/* Private fitting salon */}
            <div className="mt-8 rounded-2xl bg-surface-muted p-6 space-y-3">
              <h3 className="text-xl leading-7 font-medium text-ink">Book a Bespoke Consultation</h3>
              <p className="text-sm md:text-base leading-[26px] text-ink-secondary">
                Visiting Jaipur? Schedule a private appointment at our historic atelier salon for custom body measurements, velvet swatch viewings, and personal styling with our master tailor.
              </p>
              <a
                href="https://wa.me/919829014820?text=Hello%20Saffron%20Threads,%20I%20would%20like%20to%20request%20a%20private%20atelier%20consultation."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-on-primary text-sm md:text-base font-semibold hover:bg-primary-hover transition-colors"
              >
                <MessageSquare aria-hidden="true" className="w-4 h-4" />
                <span>Reserve on WhatsApp</span>
              </a>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-6">
              <div>
                <p className="text-base font-medium text-ink">Have Quick Questions?</p>
                <p className="text-sm text-ink-secondary">Read our guide to made-to-order sizing &amp; shipping.</p>
              </div>
              <Link
                href="/faqs"
                className="shrink-0 inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-ink hover:text-primary-hover"
              >
                View FAQs <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
