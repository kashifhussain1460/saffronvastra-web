"use client";

import { BRAND } from "@/lib/brand";
import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus, Mail, Phone, ArrowUpRight, Check } from "lucide-react";
import { useSiteSettings } from "@/context/SettingsContext";
import { useCatalogNav } from "@/components/layout/useCatalogNav";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { emailError } from "@/lib/validation";

type FooterLink = { label: string; href: string };

const HEADING = "text-base font-semibold text-ink";

// Below md each column collapses into a plus/minus accordion (Modave footer); md+ shows plain columns.
// Every anchor stays in the DOM at all widths: closed panels are only hidden below md.
function FooterColumn({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line md:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`footer-${id}`}
        className={`md:hidden flex w-full items-center justify-between min-h-14 py-4 text-left ${HEADING}`}
      >
        <span>{title}</span>
        {open ? <Minus aria-hidden="true" className="w-4 h-4" /> : <Plus aria-hidden="true" className="w-4 h-4" />}
      </button>
      <h3 className={`hidden md:block mb-4 ${HEADING}`}>{title}</h3>
      <div id={`footer-${id}`} className={`${open ? "block pb-5" : "hidden"} md:block md:pb-0`}>
        {children}
      </div>
    </div>
  );
}

function LinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="space-y-1 md:space-y-2">
      {links.map((link) => (
        <li key={link.href + link.label}>
          <Link href={link.href} className="inline-block py-1.5 md:py-0 text-sm leading-[22px] text-ink-secondary hover:text-primary-hover transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    // the same check as the rest of the site, so a bad address gets a visible message instead of a browser tooltip
    const invalid = emailError(email);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSending(true);
    setError("");
    const result = await subscribeToNewsletter(email, "footer");
    setSending(false);
    if (result.ok) setSubscribed(true);
    else setError(result.message);
  };

  return (
    <div>
      <p className="text-sm leading-[22px] text-ink-secondary">
        Get early access to new collections, exclusive offers, and stories from our Jaipur artisans.
      </p>
      {subscribed ? (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-success-bg px-4 py-3 text-sm text-success">
          <Check aria-hidden="true" className="w-4 h-4 shrink-0" />
          Welcome to the Saffron Circle. We will be in touch soon.
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="relative mt-4">
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Newsletter email
          </label>
          <input
            id="footer-newsletter-email"
            type="text"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "footer-newsletter-error" : undefined}
            placeholder="your@email.com"
            className="w-full h-14 rounded-full border border-line-strong bg-canvas pl-5 pr-16 text-base sm:text-sm text-ink placeholder:text-ink-muted outline-none focus:border-ink transition-colors"
          />
          <button
            type="submit"
            aria-label={sending ? "Subscribing" : "Subscribe"}
            disabled={sending}
            className="absolute right-1 top-1 w-12 h-12 rounded-full bg-primary text-on-primary inline-flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            <ArrowUpRight aria-hidden="true" className="w-5 h-5" />
          </button>
        </form>
      )}
      {error && (
        <p id="footer-newsletter-error" role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
      <p className="mt-4 text-sm leading-[22px] text-ink-secondary">
        By subscribing, you agree to our{" "}
        <Link href="/policies/terms" className="font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link href="/policies/privacy" className="font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

// The shop column lists the categories that really exist (top level, in their admin order).
export default function Footer() {
  const { store, cod } = useSiteSettings();
  const { categories } = useCatalogNav();
  const [openCols, setOpenCols] = useState<Record<string, boolean>>({});
  const toggleCol = (k: string) => setOpenCols((o) => ({ ...o, [k]: !o[k] }));

  const shopLinks: FooterLink[] = [
    ...categories.slice(0, 6).map((c) => ({ label: c.name, href: `/collections?category=${encodeURIComponent(c.slug)}` })),
    { label: "All Products", href: "/collections" },
  ];

  const aboutLinks: FooterLink[] = [
    { label: "Our Story", href: "/about" },
    { label: "Artisans", href: "/about#artisans" },
    { label: "Sustainability", href: "/about#sustainability" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" },
  ];

  const helpLinks: FooterLink[] = [
    { label: "Size Guide", href: "/size-guide" },
    { label: "Shipping", href: "/policies/shipping" },
    { label: "Returns", href: "/policies/returns" },
    { label: "FAQs", href: "/faqs" },
    { label: "Track Order", href: "/track-order" },
  ];

  const phoneHref = store.supportPhone ? `tel:${store.supportPhone.replace(/[^\d+]/g, "")}` : "";

  return (
    <footer className="bg-canvas text-ink border-t border-line pb-[var(--bottom-nav-h,0px)]">
      <div className="mx-auto max-w-[1320px] px-[15px] pt-10 pb-6 md:pt-16 md:pb-12 lg:pt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0 md:gap-x-8 md:gap-y-10 lg:gap-x-8">
          {/* Brand + contact */}
          <div className="md:order-1 lg:order-none lg:col-span-4 pb-6 md:pb-0">
            <Link href="/" aria-label="SaffronVastra home" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encodeURI("/SaffronVastra Botanical Monogram Logo (1).png")}
                alt="SaffronVastra"
                width={1086}
                height={362}
                className="h-auto w-[200px] md:w-[240px] mix-blend-multiply"
              />
            </Link>
            {store.address && <p className="mt-5 max-w-xs text-base leading-relaxed text-ink-secondary">{store.address}</p>}
            <Link
              href="/contact"
              className="mt-2 inline-flex items-center gap-1.5 min-h-11 md:min-h-0 text-xs font-semibold uppercase tracking-[0.1em] text-ink hover:text-primary-hover transition-colors"
            >
              Get Direction <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
            </Link>
            <ul className="mt-3 space-y-2 text-base text-ink-secondary">
              {store.supportEmail && (
                <li>
                  <a href={`mailto:${store.supportEmail}`} className="inline-flex items-center gap-3 min-h-10 md:min-h-0 break-all hover:text-primary-hover transition-colors">
                    <Mail aria-hidden="true" className="w-[18px] h-[18px] shrink-0 text-ink" />
                    {store.supportEmail}
                  </a>
                </li>
              )}
              {store.supportPhone && (
                <li>
                  <a href={phoneHref} className="inline-flex items-center gap-3 min-h-10 md:min-h-0 hover:text-primary-hover transition-colors">
                    <Phone aria-hidden="true" className="w-[18px] h-[18px] shrink-0 text-ink" />
                    {store.supportPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Link columns */}
          <div className="md:order-3 md:col-span-2 lg:order-none lg:col-span-5 grid grid-cols-1 md:grid-cols-3 md:gap-6 border-t border-line md:border-t-0">
            <FooterColumn id="shop" title="Shop" open={!!openCols.shop} onToggle={() => toggleCol("shop")}>
              <LinkList links={shopLinks} />
            </FooterColumn>
            <FooterColumn id="about" title="Information" open={!!openCols.about} onToggle={() => toggleCol("about")}>
              <LinkList links={aboutLinks} />
            </FooterColumn>
            <FooterColumn id="help" title="Customer Services" open={!!openCols.help} onToggle={() => toggleCol("help")}>
              <LinkList links={helpLinks} />
            </FooterColumn>
          </div>

          {/* Newsletter */}
          <div className="md:order-2 lg:order-none lg:col-span-3">
            <FooterColumn id="newsletter" title="Newsletter" open={!!openCols.newsletter} onToggle={() => toggleCol("newsletter")}>
              <FooterNewsletter />
            </FooterColumn>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1320px] px-[15px] py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-ink-secondary">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <Link href="/policies/privacy" className="whitespace-nowrap hover:text-primary-hover transition-colors">
              Privacy Policy
            </Link>
            <Link href="/policies/terms" className="whitespace-nowrap hover:text-primary-hover transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
          {cod.enabled && (
            <p className="flex items-center gap-2">
              <span>Payment:</span>
              <span className="inline-flex items-center h-7 px-2.5 rounded border border-line text-xs font-semibold text-ink">Cash on Delivery</span>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
