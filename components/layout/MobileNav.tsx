"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, Heart, User, Search, LogOut, ShieldCheck, Package, Mail, Phone, ArrowUpRight, ArrowRight } from "lucide-react";
import Offcanvas from "@/components/ui/Offcanvas";
import { AccordionItem } from "@/components/ui/Accordion";
import { useStore } from "@/context/StoreContext";
import { useSiteSettings } from "@/context/SettingsContext";
import { useCatalogNav } from "@/components/layout/useCatalogNav";
import { BRAND } from "@/lib/brand";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open with the Shop section expanded (the bottom toolbar's "Categories" button). */
  initialSection?: "shop" | null;
}

const ROW = "flex w-full items-center justify-between gap-4 min-h-12 py-3 text-sm font-semibold tracking-wide uppercase text-left transition-colors";
const SUB_LINK = "flex items-center min-h-9 py-1.5 text-sm text-ink-secondary hover:text-primary transition-colors";
const PILL =
  "inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-surface-muted text-sm font-medium text-ink hover:text-primary transition-colors border border-line";

const LINKS = [
  { href: "/collections?sort=newest", label: "New Arrivals" },
  { href: "/collections?sort=bestselling", label: "Best Sellers" },
  { href: "/about", label: "About Us" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
  { href: "/faqs", label: "FAQs" },
];

export default function MobileNav({ isOpen, onClose, initialSection = null }: MobileNavProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, isAuthenticated, logout, wishlist } = useStore();
  const { store } = useSiteSettings();
  const nav = useCatalogNav(isOpen);
  const [shopOpen, setShopOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) setShopOpen(initialSection === "shop" || pathname.startsWith("/collections") || pathname.startsWith("/products"));
  }, [isOpen, initialSection, pathname]);

  // close when the route changes (a link inside was followed)
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (firstPath.current !== pathname) {
      firstPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("ATELIER_STAFF");
  const phoneHref = store.supportPhone ? `tel:${store.supportPhone.replace(/[^\d+]/g, "")}` : "";

  return (
    <Offcanvas open={isOpen} onClose={onClose} label="Main navigation" side="left" initialFocusRef={closeRef} className="xl:hidden">
      
      {/* Top Header with Close Button and Brand Monogram */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/brand/saffronvastra-mark.png"
            alt={BRAND.name}
            width={28}
            height={28}
            className="w-6 h-6 object-contain"
          />
          <span className="font-serif font-bold text-base tracking-wide text-ink">
            {BRAND.name}
          </span>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="w-10 h-10 inline-flex items-center justify-center text-ink hover:text-primary transition-colors rounded-full hover:bg-surface-muted"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5 stroke-[1.75]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        
        {/* Search Input */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (!q) return;
            onClose();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
          className="relative mb-5"
        >
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search embroidery collections..."
            aria-label="Search products"
            className="w-full h-11 rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-primary transition-colors"
          />
        </form>

        {/* Navigation List */}
        <ul className="space-y-0.5">
          <li className="border-b border-line/60">
            <Link
              href="/"
              onClick={onClose}
              aria-current={isActive("/") ? "page" : undefined}
              className={`${ROW} ${isActive("/") ? "text-primary font-bold" : "text-ink hover:text-primary"}`}
            >
              Home
            </Link>
          </li>

          {/* Hierarchical Shop & Collections Accordion */}
          <li className="border-b border-line/60">
            <AccordionItem
              title={
                <span className={isActive("/collections") || isActive("/products") ? "text-primary font-bold" : "text-ink"}>
                  Shop & Collections
                </span>
              }
              open={shopOpen}
              onToggle={setShopOpen}
              buttonClassName={`${ROW} text-ink`}
              panelClassName="pl-2 pb-3"
            >
              <div className="space-y-2 pt-1">
                {nav.categories.map((cat) => (
                  <div key={cat.id || cat.slug} className="rounded-xl bg-surface-muted/50 p-2.5 border border-line/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <Link
                        href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                        onClick={onClose}
                        className="font-serif font-medium text-base text-ink hover:text-primary"
                      >
                        {cat.name}
                      </Link>
                      <Link
                        href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                        onClick={onClose}
                        className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-0.5"
                      >
                        <span>All</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <ul className="grid grid-cols-2 gap-1 mt-1 pl-1 border-l-2 border-primary/30">
                        {cat.subcategories.map((sub) => (
                          <li key={sub.id || sub.slug}>
                            <Link
                              href={`/collections?category=${encodeURIComponent(sub.slug)}`}
                              onClick={onClose}
                              className="text-xs text-ink-secondary hover:text-primary py-1 block truncate"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                <Link
                  href="/collections"
                  onClick={onClose}
                  className="flex items-center justify-between min-h-10 px-3 rounded-lg text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                >
                  <span>Browse Full Atelier Archive</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AccordionItem>
          </li>

          {LINKS.map((l) => (
            <li key={l.href} className="border-b border-line/60">
              <Link
                href={l.href}
                onClick={onClose}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`${ROW} ${isActive(l.href) ? "text-primary font-bold" : "text-ink hover:text-primary"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Quick Account & Wishlist Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/account/wishlist" onClick={onClose} className={PILL}>
            <Heart className="w-4 h-4 stroke-[1.75] text-primary" aria-hidden="true" />
            <span>Wishlist</span>
            {wishlist.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                {wishlist.length}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <Link href="/account" onClick={onClose} className={PILL}>
              <User className="w-4 h-4 stroke-[1.75] text-primary" aria-hidden="true" />
              <span>My Account</span>
            </Link>
          ) : (
            <Link href="/auth/login" onClick={onClose} className={PILL}>
              <User className="w-4 h-4 stroke-[1.75] text-primary" aria-hidden="true" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Account Details & Order Tracking */}
        <div className="mt-4 pt-4 border-t border-line text-sm">
          {isAuthenticated ? (
            <div className="space-y-2">
              <p className="text-xs text-ink-muted truncate">
                Signed in as <span className="font-semibold text-ink">{user?.fullName || user?.email}</span>
              </p>
              <Link
                href="/account/orders"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-ink-secondary hover:text-primary min-h-9"
              >
                <Package className="w-4 h-4 text-primary" /> Track Orders & Milestones
              </Link>
              {isAdmin && (
                <div>
                  <Link
                    href="/admin/orders"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-primary font-semibold min-h-9"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin Portal
                  </Link>
                </div>
              )}
              <div>
                <button
                  type="button"
                  aria-label="Sign Out"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="inline-flex items-center gap-2 text-ink-muted hover:text-error min-h-9 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/auth/register"
                onClick={onClose}
                className="inline-flex items-center text-xs text-ink-secondary hover:text-primary min-h-8"
              >
                New patron? <span className="ml-1 font-semibold text-primary underline">Create an account</span>
              </Link>
              <div>
                <Link
                  href="/track-order"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-xs text-ink-secondary hover:text-primary min-h-8"
                >
                  <Package className="w-3.5 h-3.5" /> Track a Guest Order
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Need Help / Concierge Block */}
        <div className="mt-6 pt-5 border-t border-line">
          <p className="font-serif text-base font-medium text-ink">Atelier Concierge</p>
          {store.address && (
            <p className="mt-2 text-xs text-ink-secondary leading-relaxed">{store.address}</p>
          )}
          <ul className="mt-3 space-y-2 text-xs text-ink-secondary">
            {store.supportEmail && (
              <li>
                <a
                  href={`mailto:${store.supportEmail}`}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {store.supportEmail}
                </a>
              </li>
            )}
            {store.supportPhone && (
              <li>
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {store.supportPhone}
                </a>
              </li>
            )}
          </ul>
        </div>

      </div>
    </Offcanvas>
  );
}
