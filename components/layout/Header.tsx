"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import Logo from "@/components/brand/Logo";
import PriceTag from "@/components/ui/PriceTag";
import { useCatalogNav, useFeaturedProducts } from "@/components/layout/useCatalogNav";
import { Search, User, Heart, ShoppingBag, LogOut, Package, ShieldCheck, ChevronDown, AlignLeft } from "lucide-react";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/collections", mega: true },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQs", href: "/faqs" },
] as const;

const SHOP_LINKS = [
  { label: "All Products", href: "/collections" },
  { label: "Search", href: "/search" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Shopping Cart", href: "/cart" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Track Order", href: "/track-order" },
];

const ICON_BTN =
  "relative inline-flex items-center justify-center w-11 h-11 xl:w-10 xl:h-10 text-ink hover:text-primary-hover transition-colors";
const MEGA_HEADING = "mb-2 text-xs font-bold uppercase tracking-[0.08em] text-ink";
const MEGA_LINK = "inline-block py-[7px] text-base text-ink-secondary hover:text-primary-hover transition-colors";

interface HeaderProps {
  /** Opens the mobile off-canvas menu (owned by StorefrontShell). */
  onOpenMenu?: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const pathname = usePathname() || "/";
  const { openCart, cartCount, wishlist, openSearch, user, isAuthenticated, logout } = useStore();

  // ----- sticky behaviour: shadow once scrolled; at xl the bar slides away on scroll down and back on scroll up
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
        setScrolled(y > 0);
        if (y < 200 || megaOpenRef.current) setHidden(false);
        else if (y > lastY + 4) setHidden(true);
        else if (y < lastY - 4) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ----- Shop mega menu: hover, focus, Enter/ArrowDown open it; Escape, outside click and leaving close it
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === "/collections" && pathname.startsWith("/products"));

  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("ATELIER_STAFF");

  return (
    <header
      className={`sticky top-0 z-40 bg-canvas transition-[transform,box-shadow] duration-200 ease-out ${scrolled ? "shadow" : ""} ${
        hidden ? "xl:-translate-y-full" : ""
      }`}
    >
      <div className="mx-auto max-w-[1320px] px-[15px] h-16 xl:h-[82px] grid grid-cols-[1fr_auto_1fr] xl:grid-cols-[1fr_minmax(0,2fr)_1fr] items-center">
        {/* Left: hamburger below xl, logo at xl */}
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            className="xl:hidden -ml-2.5 w-11 h-11 inline-flex items-center justify-center text-ink hover:text-primary-hover transition-colors"
            aria-label="Open menu"
          >
            <AlignLeft className="w-7 h-7 stroke-[1.5]" />
          </button>
          <Logo kind="header" size="lg" priority className="hidden xl:inline-flex" />
        </div>

        {/* Centre: logo below xl, navigation at xl */}
        <div className="flex justify-center min-w-0">
          <Logo kind="header" size="sm" priority className="xl:hidden" />
          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center justify-center gap-5">
              {NAV.map((item) => {
                const active = isActive(item.href);
                const linkCls = `inline-flex items-center gap-1 text-base font-semibold leading-[26px] transition-colors ${
                  active ? "text-secondary" : "text-ink hover:text-primary-hover"
                }`;
                if (!("mega" in item)) {
                  return (
                    <li key={item.href} className="py-7">
                      <Link href={item.href} aria-current={active ? "page" : undefined} className={linkCls}>
                        {item.label}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li
                    key={item.href}
                    ref={megaRef}
                    className="py-7 flex items-center"
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
                      className={
                        megaOpen && !active
                          ? "inline-flex items-center gap-1 text-base font-semibold leading-[26px] text-primary-hover transition-colors"
                          : linkCls
                      }
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${item.label} menu`}
                      aria-expanded={megaOpen}
                      aria-controls="shop-mega-menu"
                      onClick={() => (megaOpen ? closeMega() : openMega())}
                      className={`ml-0.5 -mr-1 w-5 h-6 inline-flex items-center justify-center transition-colors ${
                        active || megaOpen ? "text-secondary" : "text-ink hover:text-primary-hover"
                      }`}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Mega menu: full-width panel under the header */}
                    <div
                      id="shop-mega-menu"
                      inert={!megaOpen}
                      className={`absolute left-0 right-0 top-full bg-canvas rounded-lg shadow-lg transition-[opacity,transform,visibility] duration-300 ${
                        megaOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4 pointer-events-none"
                      }`}
                    >
                      <div className="mx-auto max-w-[1320px] px-[15px] pt-8 pb-9 grid grid-cols-12 gap-x-6">
                        <div className="col-span-2">
                          <p className={MEGA_HEADING}>Categories</p>
                          <ul>
                            {nav.categories.map((c) => (
                              <li key={c.slug}>
                                <Link href={`/collections?category=${encodeURIComponent(c.slug)}`} className={MEGA_LINK}>
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                            <li>
                              <Link href="/collections" className={MEGA_LINK}>
                                All Categories
                              </Link>
                            </li>
                          </ul>
                        </div>
                        <div className="col-span-2">
                          <p className={MEGA_HEADING}>Collections</p>
                          <ul>
                            {nav.collections.length === 0 && <li className="py-[7px] text-sm text-ink-muted">No collections yet</li>}
                            {nav.collections.map((c) => (
                              <li key={c.slug}>
                                <Link href={`/collections/${encodeURIComponent(c.slug)}`} className={MEGA_LINK}>
                                  {c.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="col-span-2">
                          <p className={MEGA_HEADING}>Shop</p>
                          <ul>
                            {SHOP_LINKS.map((l) => (
                              <li key={l.href}>
                                <Link href={l.href} className={MEGA_LINK}>
                                  {l.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="col-span-6 col-start-7 ml-auto w-full max-w-[420px]">
                          <p className={`${MEGA_HEADING} mb-4`}>Featured Products</p>
                          <ul className="grid grid-cols-2 gap-5">
                            {featured.map((p) => (
                              <li key={p.id}>
                                <Link href={`/products/${p.slug}`} className="group block">
                                  <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-surface-muted">
                                    {p.images[0] && (
                                      <Image
                                        src={p.images[0]}
                                        alt={p.title}
                                        fill
                                        sizes="200px"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                      />
                                    )}
                                  </span>
                                  <span className="mt-3 text-base text-ink line-clamp-1 group-hover:text-primary-hover transition-colors">
                                    {p.title}
                                  </span>
                                </Link>
                                <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} comparePosition="before" showDiscount={false} size="md" className="mt-1" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Right: icons */}
        <div className="flex items-center justify-end gap-0 xl:gap-1 -mr-2.5 xl:mr-0">
          <button type="button" onClick={openSearch} className={ICON_BTN} aria-label="Search">
            <Search className="w-[22px] h-[22px] stroke-[1.75]" />
          </button>

          <div className="relative hidden md:block" ref={accountRef}>
            <button
              ref={accountBtnRef}
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className={ICON_BTN}
              aria-expanded={accountOpen}
              aria-haspopup="true"
              aria-label={isAuthenticated ? `Account menu for ${user?.fullName || "patron"}` : "Guest account menu"}
            >
              <User className="w-[22px] h-[22px] stroke-[1.75]" />
            </button>

            {accountOpen && (
              <div role="menu" className="absolute right-0 top-full mt-3 w-[280px] rounded-lg bg-canvas shadow-lg z-50">
                {isAuthenticated ? (
                  <>
                    <div className="px-6 pt-6 pb-4 border-b border-line">
                      <p className="text-base font-semibold text-ink truncate">{user?.fullName || "My account"}</p>
                      <p className="text-sm text-ink-muted truncate">{user?.email}</p>
                    </div>
                    <div className="px-3 py-2">
                      {[
                        { href: "/account", label: "My Account", Icon: User },
                        { href: "/account/orders", label: "Orders & Tracking", Icon: Package },
                        { href: "/account/wishlist", label: `Wishlist (${wishlist.length})`, Icon: Heart },
                      ].map(({ href, label, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-ink hover:bg-surface-muted hover:text-primary-hover transition-colors"
                        >
                          <Icon className="w-4 h-4 stroke-[1.75]" />
                          <span>{label}</span>
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link
                          href="/admin/orders"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-ink hover:bg-surface-muted hover:text-primary-hover transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
                    </div>
                    <div className="px-3 py-2 border-t border-line">
                      <button
                        type="button"
                        role="menuitem"
                        aria-label="Sign Out"
                        onClick={() => {
                          setAccountOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 rounded px-3 py-2.5 text-sm text-ink-secondary hover:bg-surface-muted hover:text-primary-hover transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 stroke-[1.75]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 pb-5">
                      <Link
                        href="/auth/login"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex w-full items-center justify-center h-12 rounded bg-primary text-on-primary text-base font-semibold hover:bg-primary-hover transition-colors"
                      >
                        Sign In
                      </Link>
                      <p className="mt-4 text-center text-sm text-ink-secondary">
                        Don&rsquo;t have an account?{" "}
                        <Link
                          href="/auth/register"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
                        >
                          Register
                        </Link>
                      </p>
                    </div>
                    <div className="px-6 py-4 border-t border-line">
                      <Link
                        href="/track-order"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-primary-hover transition-colors"
                      >
                        <Package className="w-4 h-4 stroke-[1.75]" />
                        Track an Order
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Link href="/account/wishlist" className={`${ICON_BTN} hidden md:inline-flex`} aria-label={`Wishlist with ${wishlist.length} items`}>
            <Heart className="w-[22px] h-[22px] stroke-[1.75]" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-0.5 xl:top-0.5 xl:right-0 min-w-[14px] h-[14px] px-[3px] rounded-full bg-secondary text-on-primary text-[10px] font-medium leading-[14px] text-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button type="button" onClick={openCart} className={ICON_BTN} aria-label={`Cart with ${cartCount} items`}>
            <ShoppingBag className="w-[22px] h-[22px] stroke-[1.75]" />
            <span className="absolute top-1 right-0.5 xl:top-0.5 xl:right-0 min-w-[14px] h-[14px] px-[3px] rounded-full bg-secondary text-on-primary text-[10px] font-medium leading-[14px] text-center">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
