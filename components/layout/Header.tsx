"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Logo from "@/components/brand/Logo";
import { useCatalogNav, useFeaturedProducts } from "@/components/layout/useCatalogNav";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  LogOut,
  Package,
  ShieldCheck,
  ChevronDown,
  AlignLeft,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/collections", mega: true },
  { label: "New Arrivals", href: "/collections?sort=newest" },
  { label: "Best Sellers", href: "/collections?sort=bestselling" },
  { label: "About Us", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
] as const;

const QUICK_LINKS = [
  { label: "All Collections", href: "/collections" },
  { label: "Search Archive", href: "/search" },
  { label: "Size & Measurement Guide", href: "/size-guide" },
  { label: "Order & Milestone Tracking", href: "/track-order" },
  { label: "Frequently Asked Questions", href: "/faqs" },
];

const ICON_BTN =
  "relative inline-flex items-center justify-center w-11 h-11 xl:w-10 xl:h-10 text-ink hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full";

interface HeaderProps {
  /** Opens the mobile off-canvas menu (owned by StorefrontShell). */
  onOpenMenu?: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const pathname = usePathname() || "/";
  const { openCart, cartCount, wishlist, openSearch, user, isAuthenticated, logout } = useStore();

  // ----- sticky behaviour: elevation shadow and auto-hide on deep scroll
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaOpenRef = useRef(false);
  megaOpenRef.current = megaOpen;

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 10);
        if (y < 200 || megaOpenRef.current) setHidden(false);
        else if (y > lastY + 6) setHidden(true);
        else if (y < lastY - 6) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ----- Shop mega menu: hover, focus, Enter/ArrowDown open it; Escape, outside click close it
  const megaRef = useRef<HTMLLIElement>(null);
  const shopLinkRef = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [megaRequested, setMegaRequested] = useState(false);
  const nav = useCatalogNav(megaRequested);
  const featured = useFeaturedProducts(megaRequested, 2);

  const suppressFocusOpen = useRef(false);
  const openMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaRequested(true);
    setMegaOpen(true);
  }, []);
  const closeMega = useCallback((delay = 0) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (delay) closeTimer.current = setTimeout(() => setMegaOpen(false), delay);
    else setMegaOpen(false);
  }, []);

  // ----- account dropdown
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!megaOpen && !accountOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (megaRef.current && !megaRef.current.contains(t)) setMegaOpen(false);
      if (accountRef.current && !accountRef.current.contains(t)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (megaOpenRef.current) {
        setMegaOpen(false);
        if (megaRef.current?.contains(document.activeElement) && document.activeElement !== shopLinkRef.current) {
          suppressFocusOpen.current = true;
          shopLinkRef.current?.focus();
          suppressFocusOpen.current = false;
        }
      }
      if (accountRef.current?.contains(document.activeElement)) accountBtnRef.current?.focus();
      setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [megaOpen, accountOpen]);

  useEffect(() => {
    setAccountOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.includes("?")) {
      return pathname + (typeof window !== "undefined" ? window.location.search : "") === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`) || (href === "/collections" && pathname.startsWith("/products"));
  };

  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("ATELIER_STAFF");

  return (
    <header
      className={`sticky top-0 z-40 bg-canvas/95 backdrop-blur-md transition-[transform,box-shadow] duration-200 ease-out border-b border-line/60 ${
        scrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.06)]" : ""
      } ${hidden ? "xl:-translate-y-full" : ""}`}
    >
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 h-16 xl:h-[84px] grid grid-cols-[auto_1fr_auto] xl:grid-cols-[auto_1fr_auto] items-center gap-4 xl:gap-8">
        
        {/* Left: Mobile Hamburger & Desktop Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="xl:hidden -ml-2 w-11 h-11 inline-flex items-center justify-center text-ink hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <AlignLeft className="w-6 h-6 stroke-[1.75]" />
          </button>
          <Logo kind="header" size="lg" priority className="inline-flex" />
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav aria-label="Main Navigation" className="hidden xl:flex items-center justify-center">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => {
              const active = isActive(item.href);
              const linkCls = `relative inline-flex items-center gap-1 py-7 text-sm font-semibold tracking-wide uppercase transition-colors ${
                active ? "text-primary" : "text-ink hover:text-primary"
              }`;

              if (!("mega" in item)) {
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} className={linkCls}>
                      {item.label}
                      {active && (
                        <span className="absolute bottom-5 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </li>
                );
              }

              return (
                <li
                  key={item.href}
                  ref={megaRef}
                  className="relative flex items-center"
                  onMouseEnter={openMega}
                  onMouseLeave={() => closeMega(150)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeMega();
                  }}
                >
                  <Link
                    ref={shopLinkRef}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onFocus={() => {
                      if (!suppressFocusOpen.current) openMega();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        openMega();
                        setTimeout(() => megaRef.current?.querySelector<HTMLElement>("#shop-mega-menu a")?.focus(), 30);
                      }
                    }}
                    className={megaOpen || active ? "relative inline-flex items-center gap-1.5 py-7 text-sm font-semibold tracking-wide uppercase text-primary transition-colors" : linkCls}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${megaOpen ? "rotate-180 text-primary" : "text-ink-muted"}`} />
                    {active && (
                      <span className="absolute bottom-5 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>

                  {/* Mega Menu: Full-Width Panel */}
                  <div
                    id="shop-mega-menu"
                    inert={!megaOpen}
                    className={`fixed left-0 right-0 top-[84px] bg-white border-t border-b border-line shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] transition-[opacity,transform,visibility] duration-200 ease-out ${
                      megaOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="mx-auto max-w-[1360px] px-6 lg:px-8 py-10">
                      <div className="grid grid-cols-12 gap-8">
                        
                        {/* Dynamic Main Categories Columns (Up to 3 Main Categories with Subcategories) */}
                        {nav.categories.slice(0, 3).map((cat) => (
                          <div key={cat.id || cat.slug} className="col-span-3">
                            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-line">
                              {cat.image ? (
                                <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-line">
                                  <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 grid place-items-center text-primary font-serif font-bold">
                                  {cat.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <Link
                                  href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                                  className="font-serif text-lg font-medium text-ink hover:text-primary transition-colors block leading-tight"
                                >
                                  {cat.name}
                                </Link>
                                <span className="text-[11px] uppercase tracking-wider text-ink-muted font-sans font-semibold">
                                  Hand Embroidery
                                </span>
                              </div>
                            </div>

                            {/* Subcategories List */}
                            <ul className="space-y-2">
                              {cat.subcategories && cat.subcategories.length > 0 ? (
                                cat.subcategories.map((sub) => (
                                  <li key={sub.id || sub.slug}>
                                    <Link
                                      href={`/collections?category=${encodeURIComponent(sub.slug)}`}
                                      className="group flex items-center justify-between text-sm text-ink-secondary hover:text-primary py-1 transition-colors"
                                    >
                                      <span>{sub.name}</span>
                                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                    </Link>
                                  </li>
                                ))
                              ) : (
                                <li>
                                  <Link
                                    href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                                    className="text-sm text-ink-secondary hover:text-primary py-1 block"
                                  >
                                    View Collection Pieces
                                  </Link>
                                </li>
                              )}
                            </ul>

                            <Link
                              href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
                            >
                              <span>Explore All {cat.name}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        ))}

                        {/* Quick Curations & Services Column */}
                        <div className="col-span-3">
                          <div className="pb-3 mb-4 border-b border-line">
                            <h4 className="font-serif text-lg font-medium text-ink leading-tight">
                              Featured Collections
                            </h4>
                            <span className="text-[11px] uppercase tracking-wider text-ink-muted font-sans font-semibold">
                              Direct Services
                            </span>
                          </div>

                          <ul className="space-y-2">
                            {QUICK_LINKS.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  className="group flex items-center justify-between text-sm text-ink-secondary hover:text-primary py-1 transition-colors"
                                >
                                  <span>{link.label}</span>
                                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                </Link>
                              </li>
                            ))}
                          </ul>

                          {nav.collections && nav.collections.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-line/60">
                              <p className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold mb-2">
                                Special Editions
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {nav.collections.map((col) => (
                                  <Link
                                    key={col.slug}
                                    href={`/collections/${encodeURIComponent(col.slug)}`}
                                    className="px-2.5 py-1 rounded bg-surface-muted hover:bg-accent/15 hover:text-primary text-xs font-medium transition-colors"
                                  >
                                    {col.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Mega Menu Footer Banner */}
                      <div className="mt-8 pt-6 border-t border-line/70 flex flex-wrap items-center justify-between text-xs text-ink-secondary">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            100% Handcrafted Authenticity
                          </span>
                          <span className="hidden sm:inline text-line">•</span>
                          <span className="hidden sm:inline">Free Live Order Tracking</span>
                          <span className="hidden sm:inline text-line">•</span>
                          <span className="hidden sm:inline">Custom Made-to-Order Sizing</span>
                        </div>
                        <Link
                          href="/collections"
                          className="font-semibold text-ink hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span>View All Collections</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: Actions (Search, Account, Wishlist, Cart) */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          
          {/* Search Trigger */}
          <button
            type="button"
            onClick={openSearch}
            className={ICON_BTN}
            aria-label="Search Catalog"
          >
            <Search className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Account Dropdown */}
          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              ref={accountBtnRef}
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className={ICON_BTN}
              aria-expanded={accountOpen}
              aria-haspopup="true"
              aria-label={isAuthenticated ? `Account menu for ${user?.fullName || "customer"}` : "Guest account menu"}
            >
              <User className="w-5 h-5 stroke-[1.75]" />
            </button>

            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white shadow-xl border border-line p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b border-line mb-1">
                      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
                        My Account
                      </p>
                      <p className="text-sm font-semibold text-ink truncate mt-0.5">
                        {user?.fullName || "Valued Customer"}
                      </p>
                      <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                    </div>

                    <div className="space-y-0.5">
                      {[
                        { href: "/account", label: "My Profile & Details", Icon: User },
                        { href: "/account/orders", label: "Orders & Milestones", Icon: Package },
                        { href: "/account/wishlist", label: `Curated Wishlist (${wishlist.length})`, Icon: Heart },
                      ].map(({ href, label, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-surface-muted hover:text-primary transition-colors"
                        >
                          <Icon className="w-4 h-4 stroke-[1.75] text-ink-muted" />
                          <span>{label}</span>
                        </Link>
                      ))}

                      {isAdmin && (
                        <Link
                          href="/admin/orders"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-primary font-semibold hover:bg-accent/10 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                          <span>Admin Control Center</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 mt-1 border-t border-line">
                      <button
                        type="button"
                        role="menuitem"
                        aria-label="Sign Out"
                        onClick={() => {
                          setAccountOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-secondary hover:bg-error-bg hover:text-error transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 stroke-[1.75]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4">
                    <div className="text-center mb-4">
                      <h4 className="font-serif text-base font-medium text-ink">
                        Welcome to Saffron Vastra
                      </h4>
                      <p className="text-xs text-ink-secondary mt-1">
                        Sign in to access your orders and curated wardrobe.
                      </p>
                    </div>

                    <Link
                      href="/auth/login"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex w-full items-center justify-center h-10 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
                    >
                      Sign In
                    </Link>

                    <div className="mt-3 text-center text-xs text-ink-secondary">
                      New customer?{" "}
                      <Link
                        href="/auth/register"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
                      >
                        Create an Account
                      </Link>
                    </div>

                    <div className="mt-3 pt-3 border-t border-line">
                      <Link
                        href="/track-order"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center justify-center gap-1.5 text-xs text-ink-muted hover:text-primary transition-colors py-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Track a Guest Order</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wishlist Link */}
          <Link
            href="/account/wishlist"
            className={`${ICON_BTN} hidden md:inline-flex`}
            aria-label={`Wishlist with ${wishlist.length} items`}
          >
            <Heart className="w-5 h-5 stroke-[1.75]" />
            {wishlist.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold leading-4 text-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Shopping Bag Trigger */}
          <button
            type="button"
            onClick={openCart}
            className={ICON_BTN}
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold leading-4 text-center">
              {cartCount}
            </span>
          </button>

        </div>

      </div>
    </header>
  );
}
