"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Menu, Search, Heart, ShoppingBag } from "lucide-react";
import { useStore } from "@/context/StoreContext";

// Modave mobile toolbar (below lg): Shop, Categories, Search, Wishlist, Cart.
// While visible it publishes --bottom-nav-h (70px + safe-area inset) on :root so pages with their own
// fixed bottom bars (e.g. the cart's sticky checkout bar) can sit above it with `bottom: var(--bottom-nav-h, 0px)`.
const HIDDEN_ON = ["/checkout", "/order-confirmation", "/auth"];

const ITEM = "relative flex h-11 w-full flex-col items-center justify-center gap-0.5 hover:text-primary-hover transition-colors";
const LABEL = "text-xs leading-4";
const BADGE =
  "absolute -top-1 left-1/2 ml-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-secondary text-on-primary text-[10px] font-medium leading-[14px] text-center";

export default function BottomNav({ onOpenCategories }: { onOpenCategories?: () => void }) {
  const pathname = usePathname() || "/";
  const { openSearch, openCart, cartCount, wishlist } = useStore();
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const shopActive = pathname.startsWith("/collections") || pathname.startsWith("/products");
  const wishActive = pathname.startsWith("/account/wishlist");

  return (
    <>
      <style>{`:root{--bottom-nav-h:0px}@media (max-width:1023.98px){:root{--bottom-nav-h:calc(70px + env(safe-area-inset-bottom, 0px))}}`}</style>
      <nav
        aria-label="Toolbar"
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-canvas shadow-[0_5px_18px_5px_rgb(var(--color-ink)/0.12)] pt-[13px] pb-[max(13px,env(safe-area-inset-bottom))]"
      >
        <ul className="grid grid-cols-5">
          <li>
            <Link href="/collections" aria-current={shopActive ? "page" : undefined} className={`${ITEM} ${shopActive ? "text-secondary" : "text-ink"}`}>
              <LayoutGrid className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              <span className={LABEL}>Shop</span>
            </Link>
          </li>
          <li>
            <button type="button" onClick={onOpenCategories} className={`${ITEM} text-ink`} aria-haspopup="dialog">
              <Menu className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              <span className={LABEL}>Categories</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={openSearch} className={`${ITEM} text-ink`} aria-haspopup="dialog">
              <Search className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              <span className={LABEL}>Search</span>
            </button>
          </li>
          <li>
            <Link href="/account/wishlist" aria-current={wishActive ? "page" : undefined} className={`${ITEM} ${wishActive ? "text-secondary" : "text-ink"}`}>
              <Heart className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              <span className={LABEL}>Wishlist</span>
              {wishlist.length > 0 && (
                <span className={BADGE} aria-hidden="true">
                  {wishlist.length}
                </span>
              )}
            </Link>
          </li>
          <li>
            <button type="button" onClick={openCart} className={`${ITEM} text-ink`} aria-haspopup="dialog">
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              <span className={LABEL}>Cart</span>
              {cartCount > 0 && (
                <span className={BADGE} aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
