"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  User,
  CreditCard,
  Star,
  Bell,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import PageTitle, { type Crumb } from "@/components/checkout/PageTitle";
import { useDialogBehaviour } from "./AccountModal";

export type AccountSection =
  | "dashboard"
  | "orders"
  | "addresses"
  | "wishlist"
  | "profile"
  | "payment"
  | "reviews"
  | "notifications";

/** Sections that live as tabs on /account; elsewhere they are reached through /account#<id>. */
export const DASHBOARD_TABS: AccountSection[] = ["dashboard", "addresses", "profile", "payment", "reviews"];

const NAV: Array<{ id: AccountSection; label: string; icon: LucideIcon; href: string }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/account" },
  { id: "orders", label: "My Orders", icon: Package, href: "/account/orders" },
  { id: "addresses", label: "Addresses", icon: MapPin, href: "/account#addresses" },
  { id: "wishlist", label: "Wishlist", icon: Heart, href: "/account/wishlist" },
  { id: "profile", label: "Profile Details", icon: User, href: "/account#profile" },
  { id: "payment", label: "Payment Methods", icon: CreditCard, href: "/account#payment" },
  { id: "reviews", label: "My Reviews", icon: Star, href: "/account#reviews" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/account/notifications" },
];

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "ST";

function SidebarCard({
  name,
  email,
  active,
  onSelect,
  onNavigate,
}: {
  name: string;
  email: string;
  active: AccountSection;
  onSelect?: (section: AccountSection) => void;
  onNavigate?: () => void;
}) {
  const { logout } = useStore();
  const itemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-lg font-medium text-left transition-colors ${
      isActive ? "bg-surface text-ink" : "text-ink hover:bg-surface hover:text-primary-hover"
    }`;

  return (
    <div className="rounded-[20px] bg-surface-muted px-6 py-8 xl:px-8 xl:py-10">
      <div className="text-center">
        <div
          aria-hidden="true"
          className="mx-auto w-24 h-24 xl:w-[140px] xl:h-[140px] rounded-full bg-surface border border-line flex items-center justify-center font-heading text-3xl xl:text-[40px] font-medium text-ink"
        >
          {initialsOf(name)}
        </div>
        <p className="mt-4 font-heading text-xl font-medium text-ink break-words">{name}</p>
        {email && <p className="mt-1 text-base text-ink-secondary break-all">{email}</p>}
      </div>

      <nav aria-label="Account" className="mt-8 xl:mt-10">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const content = (
              <>
                <Icon className="w-6 h-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </>
            );
            return (
              <li key={item.id}>
                {onSelect && DASHBOARD_TABS.includes(item.id) ? (
                  <button
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      onSelect(item.id);
                      onNavigate?.();
                    }}
                    className={itemClass(isActive)}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onNavigate}
                    className={itemClass(isActive)}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => void logout()} className={itemClass(false)}>
              <LogOut className="w-6 h-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

/**
 * Modave "My Account" frame: title band, then a left sidebar (avatar, name, email, navigation) beside the content.
 * Below lg the sidebar opens as a drawer from an "Account menu" button.
 */
export default function AccountShell({
  title,
  crumbs,
  active,
  onSelect,
  profile,
  children,
}: {
  title: string;
  crumbs?: Crumb[];
  active: AccountSection;
  onSelect?: (section: AccountSection) => void;
  profile?: { name?: string; email?: string };
  children: React.ReactNode;
}) {
  const { user } = useStore();
  const name = profile?.name || user?.fullName || "My Account";
  const email = profile?.email || user?.email || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  useDialogBehaviour(menuOpen, () => setMenuOpen(false), drawerRef);

  const activeLabel = NAV.find((n) => n.id === active)?.label || "Account";

  return (
    <div className="bg-surface text-ink">
      <PageTitle
        title={title}
        crumbs={crumbs || [{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: activeLabel }]}
      />

      <section className="max-w-[1320px] mx-auto px-4 lg:px-[15px] py-10 md:py-16 lg:py-20">
        <div className="max-w-[1130px] mx-auto lg:flex lg:items-start lg:gap-10 xl:gap-20">
          {/* Mobile and tablet: compact identity row with the menu trigger */}
          <div className="lg:hidden mb-8 flex items-center gap-3 rounded-2xl bg-surface-muted p-3 pl-4">
            <div
              aria-hidden="true"
              className="w-11 h-11 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center font-heading text-base font-medium"
            >
              {initialsOf(name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink truncate">{name}</p>
              {email && <p className="text-sm text-ink-secondary truncate">{email}</p>}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="account-menu-drawer"
              className="shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
              Account menu
            </button>
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[300px] xl:w-[369px] shrink-0">
            <SidebarCard name={name} email={email} active={active} onSelect={onSelect} />
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </section>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={() => setMenuOpen(false)} />
          <div
            ref={drawerRef}
            id="account-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-[min(360px,92vw)] overflow-y-auto bg-surface px-4 pb-6 shadow-drawer outline-none"
          >
            <div className="flex items-center justify-between -mx-4 mb-4 pl-4 pr-1 bg-surface-muted">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink">Account menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close account menu"
                className="w-11 h-11 rounded-full flex items-center justify-center text-ink hover:text-primary-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarCard
              name={name}
              email={email}
              active={active}
              onSelect={onSelect}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
