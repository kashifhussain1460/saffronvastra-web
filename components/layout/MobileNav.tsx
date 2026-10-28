"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Heart, User, Search, LogOut, ShieldCheck, Package, Mail, Phone, ArrowUpRight } from "lucide-react";
import Offcanvas from "@/components/ui/Offcanvas";
import { AccordionItem } from "@/components/ui/Accordion";
import { useStore } from "@/context/StoreContext";
import { useSiteSettings } from "@/context/SettingsContext";
import { useCatalogNav } from "@/components/layout/useCatalogNav";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open with the Shop section expanded (the bottom toolbar's "Categories" button). */
  initialSection?: "shop" | null;
}

const ROW = "flex w-full items-center justify-between gap-4 min-h-12 py-3 text-base font-semibold text-left transition-colors";
const SUB_LINK = "flex items-center min-h-9 py-1.5 text-sm text-ink-secondary hover:text-primary-hover transition-colors";
const PILL =
  "inline-flex items-center gap-2 h-11 px-4 rounded bg-surface-muted text-base font-medium text-ink hover:text-primary-hover transition-colors";

const LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faqs", label: "FAQs" },
];

// Modave mobile menu: left off-canvas with a close button, a search box, accordion navigation,
// quick account buttons and the "Need Help?" contact block.
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
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute left-2 top-3 w-11 h-11 inline-flex items-center justify-center text-ink hover:text-primary-hover transition-colors"
        aria-label="Close navigation"
      >
        <X className="w-6 h-6 stroke-[1.5]" />
      </button>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-[60px] pb-8">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (!q) return;
            onClose();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
          className="relative"
        >
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            aria-label="Search products"
            className="w-full h-12 rounded-lg border border-line bg-canvas pl-11 pr-3.5 text-base text-ink placeholder:text-ink-muted outline-none focus:border-ink transition-colors"
          />
        </form>

        <ul className="mt-5">
          <li className="border-b border-line">
            <Link href="/" onClick={onClose} aria-current={isActive("/") ? "page" : undefined} className={`${ROW} ${isActive("/") ? "text-secondary" : "text-ink hover:text-primary-hover"}`}>
              Home
            </Link>
          </li>
          <li className="border-b border-line">
            <AccordionItem
              title={<span className={isActive("/collections") || isActive("/products") ? "text-secondary" : ""}>Shop</span>}
              open={shopOpen}
              onToggle={setShopOpen}
              buttonClassName={`${ROW} text-ink`}
              panelClassName="pl-2.5 pb-3"
            >
              <AccordionItem title="Categories" defaultOpen buttonClassName="flex w-full items-center justify-between gap-4 min-h-10 py-2 text-sm text-ink-secondary text-left" iconClassName="w-3.5 h-3.5 text-ink" panelClassName="pl-3 pb-1">
                <ul>
                  {nav.categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/collections?category=${encodeURIComponent(c.slug)}`} onClick={onClose} className={SUB_LINK}>
                        {c.name}
                        {typeof c.count === "number" && <span className="ml-1.5 text-xs text-ink-muted">({c.count})</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionItem>
              {nav.collections.length > 0 && (
                <AccordionItem title="Collections" buttonClassName="flex w-full items-center justify-between gap-4 min-h-10 py-2 text-sm text-ink-secondary text-left" iconClassName="w-3.5 h-3.5 text-ink" panelClassName="pl-3 pb-1">
                  <ul>
                    {nav.collections.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/collections/${encodeURIComponent(c.slug)}`} onClick={onClose} className={SUB_LINK}>
                          {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionItem>
              )}
              <Link href="/collections" onClick={onClose} className="flex items-center min-h-10 py-2 text-sm text-ink-secondary hover:text-primary-hover transition-colors">
                All Products
              </Link>
            </AccordionItem>
          </li>
          {LINKS.map((l) => (
            <li key={l.href} className="border-b border-line last:border-b-0">
              <Link href={l.href} onClick={onClose} aria-current={isActive(l.href) ? "page" : undefined} className={`${ROW} ${isActive(l.href) ? "text-secondary" : "text-ink hover:text-primary-hover"}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Quick account buttons */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/account/wishlist" onClick={onClose} className={PILL}>
            <Heart className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
            Wishlist{wishlist.length > 0 && <span className="text-sm text-ink-muted">({wishlist.length})</span>}
          </Link>
          {isAuthenticated ? (
            <Link href="/account" onClick={onClose} className={PILL}>
              <User className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              My Account
            </Link>
          ) : (
            <Link href="/auth/login" onClick={onClose} className={PILL}>
              <User className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              Sign In
            </Link>
          )}
        </div>

        <ul className="mt-3 text-sm">
          {isAuthenticated ? (
            <>
              <li className="px-0.5 py-1 text-ink-muted truncate">Signed in as {user?.fullName || user?.email}</li>
              <li>
                <Link href="/account/orders" onClick={onClose} className="inline-flex items-center gap-2 min-h-10 text-ink-secondary hover:text-primary-hover">
                  <Package className="w-4 h-4" aria-hidden="true" /> Track Orders
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/admin/orders" onClick={onClose} className="inline-flex items-center gap-2 min-h-10 text-ink-secondary hover:text-primary-hover">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Admin Portal
                  </Link>
                </li>
              )}
              <li>
                <button
                  type="button"
                  aria-label="Sign Out"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="inline-flex items-center gap-2 min-h-10 text-ink-secondary hover:text-primary-hover"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/auth/register" onClick={onClose} className="inline-flex items-center min-h-10 text-ink-secondary hover:text-primary-hover">
                  New here? <span className="ml-1 font-semibold text-ink underline underline-offset-2">Create an account</span>
                </Link>
              </li>
              <li>
                <Link href="/track-order" onClick={onClose} className="inline-flex items-center gap-2 min-h-10 text-ink-secondary hover:text-primary-hover">
                  <Package className="w-4 h-4" aria-hidden="true" /> Track an Order
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Need help */}
        <div className="mt-6">
          <p className="text-lg font-medium text-ink">Need Help?</p>
          {store.address && <p className="mt-3 text-base text-ink-secondary leading-relaxed">{store.address}</p>}
          <Link href="/contact" onClick={onClose} className="mt-2 inline-flex items-center gap-1.5 min-h-10 text-sm font-semibold uppercase tracking-[0.08em] text-ink hover:text-primary-hover transition-colors">
            Get Direction <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <ul className="mt-1 space-y-1 text-base text-ink-secondary">
            {store.supportEmail && (
              <li>
                <a href={`mailto:${store.supportEmail}`} className="inline-flex items-center gap-3 min-h-10 break-all hover:text-primary-hover transition-colors">
                  <Mail className="w-5 h-5 shrink-0 text-ink" aria-hidden="true" />
                  {store.supportEmail}
                </a>
              </li>
            )}
            {store.supportPhone && (
              <li>
                <a href={phoneHref} className="inline-flex items-center gap-3 min-h-10 hover:text-primary-hover transition-colors">
                  <Phone className="w-5 h-5 shrink-0 text-ink" aria-hidden="true" />
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
