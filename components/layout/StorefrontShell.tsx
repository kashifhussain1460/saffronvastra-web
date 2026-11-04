"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import ScrollTopButton from "./ScrollTopButton";
import { buildCatalogNav, type CatalogNavData } from "./useCatalogNav";

// The overlays render nothing until opened, so they load in the browser only and stay out of the first-load bundle.
const MobileNav = dynamic(() => import("./MobileNav"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/search/SearchModal"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), { ssr: false });

interface StorefrontShellProps {
  children: React.ReactNode;
  /** The announcement bar, rendered on the server by the root layout. */
  announcement?: React.ReactNode;
  /** Categories and collections read on the server (null when the API could not be reached: the browser loads them). */
  navData?: CatalogNavData | null;
}

// Modave shell: the top bar scrolls away, the header below it is sticky; below lg a fixed toolbar sits at the bottom.
export default function StorefrontShell({ children, announcement, navData }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  // sign-in, registration and password pages are full-screen: no header, footer or bottom bar
  const isAuth = pathname === "/auth" || pathname?.startsWith("/auth/");
  const [menu, setMenu] = useState<{ open: boolean; section: "shop" | null }>({ open: false, section: null });
  const closeMenu = useCallback(() => setMenu((m) => ({ ...m, open: false })), []);
  const openMenu = useCallback(() => setMenu({ open: true, section: null }), []);
  const openCategories = useCallback(() => setMenu({ open: true, section: "shop" }), []);
  const initialNav = useMemo(
    () => (navData ? buildCatalogNav(navData.categories, navData.collections) : null),
    [navData]
  );

  if (isAdmin || isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      {/* first focusable element; visible only while focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-primary"
      >
        Skip to main content
      </a>
      {announcement}
      <Header onOpenMenu={openMenu} menuOpen={menu.open} initialNav={initialNav} />
      <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
        {children}
      </main>
      <Footer initialNav={initialNav} />
      <BottomNav onOpenCategories={openCategories} />
      <ScrollTopButton />
      <MobileNav isOpen={menu.open} onClose={closeMenu} initialSection={menu.section} initialNav={initialNav} />
      <SearchModal />
      <CartDrawer />
    </>
  );
}
