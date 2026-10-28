"use client";

import React, { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import MobileNav from "./MobileNav";
import ScrollTopButton from "./ScrollTopButton";
import SearchModal from "@/components/search/SearchModal";
import CartDrawer from "@/components/cart/CartDrawer";

// Modave shell: the top bar scrolls away, the header below it is sticky; below lg a fixed toolbar sits at the bottom.
export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  // sign-in, registration and password pages are full-screen: no header, footer or bottom bar
  const isAuth = pathname === "/auth" || pathname?.startsWith("/auth/");
  const [menu, setMenu] = useState<{ open: boolean; section: "shop" | null }>({ open: false, section: null });
  const closeMenu = useCallback(() => setMenu((m) => ({ ...m, open: false })), []);
  const openMenu = useCallback(() => setMenu({ open: true, section: null }), []);
  const openCategories = useCallback(() => setMenu({ open: true, section: "shop" }), []);

  if (isAdmin || isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header onOpenMenu={openMenu} />
      <main className="flex-grow">{children}</main>
      <Footer />
      <BottomNav onOpenCategories={openCategories} />
      <ScrollTopButton />
      <MobileNav isOpen={menu.open} onClose={closeMenu} initialSection={menu.section} />
      <SearchModal />
      <CartDrawer />
    </>
  );
}
