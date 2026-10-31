"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  BookOpen,
  ShoppingBag,
  Users,
  Megaphone,
  FileText,
  ImageIcon,
  Star,
  Bell,
  Inbox,
  Send,
  Mail,
  History,
  BarChart3,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  Menu,
  Undo2,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState("");
  const [inboxNew, setInboxNew] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [returnsOpen, setReturnsOpen] = useState(0);

  // real unread admin notification count for the header bell
  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      fetch("/api/v1/admin/notifications/unread-count", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          if (!cancelled && body?.data) setNotifUnread(body.data.unreadCount || 0);
        })
        .catch(() => undefined);
    void refresh();
    window.addEventListener("admin-notifications-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("admin-notifications-changed", refresh);
    };
  }, [pathname]);

  // number of unanswered messages, shown next to Inbox
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/engagement/summary", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.data) setInboxNew(body.data.newMessages || 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // number of return / cancellation / exchange requests waiting for a decision, shown next to Returns
  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      fetch("/api/v1/admin/requests?status=Requested&limit=1", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          if (!cancelled && body?.data) setReturnsOpen(body.data.counts?.Requested || 0);
        })
        .catch(() => undefined);
    void refresh();
    window.addEventListener("admin-requests-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("admin-requests-changed", refresh);
    };
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAuth() {
      try {
        const res = await fetch("/api/v1/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const roles: string[] = Array.isArray(data.data?.roles)
            ? data.data.roles
            : Array.isArray(data.data?.user?.roles)
            ? data.data.user.roles
            : [];
          const hasAdminAccess = roles.includes("ADMIN");
          if (hasAdminAccess) {
            if (isMounted) {
              setAdminName(data.data?.fullName || data.data?.user?.fullName || data.data?.email || "Administrator");
              setIsAuthorized(true);
            }
            return;
          }
        }
      } catch (err) {
        console.error("[AdminGuard] Network error verifying administrative session:", err);
      }

      // Unauthenticated or lacks administrative privileges: redirect to login
      if (isMounted) {
        setIsAuthorized(false);
        const redirectParam = encodeURIComponent(pathname || "/admin");
        router.push(`/auth/login?redirect=${redirectParam}`);
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isAuthorized !== true) {
    return (
      <div className="min-h-screen bg-inverse text-on-inverse flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg tracking-wide text-highlight">Atelier Administration Guard</p>
        <p className="text-xs text-on-inverse-muted mt-1">Authenticating administrator privileges...</p>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    {
      label: "Products",
      href: "/admin/products",
      icon: Package,
      children: [
        { label: "All Products", href: "/admin/products" },
        { label: "Etsy CSV Import", href: "/admin/products/etsy-import" },
      ],
    },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Collections", href: "/admin/collections", icon: BookOpen },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Returns", href: "/admin/returns", icon: Undo2 },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
    { label: "Content", href: "/admin/content", icon: FileText },
    { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Inbox", href: "/admin/inbox", icon: Inbox },
    { label: "Newsletter", href: "/admin/newsletter", icon: Send },
    { label: "Emails", href: "/admin/emails", icon: Mail },
    { label: "Activity Log", href: "/admin/activity", icon: History },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row font-sans text-ink">
      {/* 1. SIDEBAR (DESKTOP) - Fixed Full-Height Viewport Docked */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-inverse text-on-inverse flex-col shrink-0 border-r border-inverse-line h-screen z-30">
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-inverse-line/80 shrink-0">
          {/* primary logo, inverted to white for the dark sidebar */}
          <Image
            src="/images/brand/saffronvastra-wordmark.png"
            alt="SaffronVastra"
            width={900}
            height={159}
            priority
            className="h-6 w-auto invert select-none"
          />
          <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] text-highlight">Admin</span>
        </div>

        {/* Navigation Links (Scrollable internally) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);

            return (
              <div key={item.label} className="space-y-0.5">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-secondary text-on-primary shadow-md font-semibold"
                      : "text-on-inverse-muted hover:text-on-primary hover:bg-on-inverse/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-on-inverse-muted" : "text-on-inverse-muted"}`} />
                  <span>{item.label}</span>
                  {item.href === "/admin/returns" && returnsOpen > 0 && (
                    <span
                      data-testid="returns-badge"
                      aria-label={`${returnsOpen} requests waiting for review`}
                      className="ml-auto text-[10px] font-semibold bg-primary text-on-primary rounded-full px-1.5 py-0.5 leading-none"
                    >
                      {returnsOpen}
                    </span>
                  )}
                  {item.href === "/admin/inbox" && inboxNew > 0 && (
                    <span
                      aria-label={`${inboxNew} new messages`}
                      className="ml-auto text-[10px] font-semibold bg-primary text-on-primary rounded-full px-1.5 py-0.5 leading-none"
                    >
                      {inboxNew}
                    </span>
                  )}
                </Link>
                {item.children && isActive && (
                  <div className="ml-7 pl-2.5 border-l border-inverse-line/60 space-y-1 my-1">
                    {item.children.map((child) => {
                      const isChildActive =
                        child.href === "/admin/products"
                          ? pathname === "/admin/products" || pathname === "/admin/products/new"
                          : pathname?.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                            isChildActive
                              ? "text-highlight font-semibold bg-on-inverse/10"
                              : "text-on-inverse-muted hover:text-on-primary hover:bg-on-inverse/5"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Decorative Botanical Flourish (Watermark) */}
        <div className="px-6 py-2 opacity-15 pointer-events-none select-none shrink-0">
          <svg className="w-full h-16 text-highlight" viewBox="0 0 100 40" fill="currentColor">
            <path d="M10,35 Q30,10 50,30 T90,15" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="50" cy="30" r="3" />
            <circle cx="70" cy="22" r="2" />
          </svg>
        </div>

        {/* Admin Profile Pill & Logout - Pinned to bottom */}
        <div className="p-4 border-t border-inverse-line bg-inverse shrink-0 mt-auto space-y-3">
          <div
            onClick={() => setAdminMenuOpen(!adminMenuOpen)}
            className="flex items-center justify-between p-2 rounded-lg bg-on-inverse/5 hover:bg-on-inverse/10 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden relative border border-highlight/40">
                <Image
                  src="/images/hero/hero_model.jpg"
                  alt={adminName || "Administrator"}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-primary leading-tight">{adminName || "Administrator"}</p>
                <p className="text-[10px] text-highlight">Admin</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-on-primary" />
          </div>

          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-on-inverse-muted hover:text-highlight transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Storefront Exit</span>
          </Link>
        </div>
      </aside>

      {/* 2. MOBILE TOPBAR & DRAWER */}
      <div className="lg:hidden bg-inverse text-on-primary px-4 py-3 border-b border-inverse-line flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md hover:bg-on-inverse/10"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Image
            src="/images/brand/saffronvastra-wordmark.png"
            alt="SaffronVastra Admin"
            width={900}
            height={159}
            className="h-5 w-auto invert select-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications" className="relative p-1.5 hover:text-highlight">
            <Bell className="w-4 h-4" />
            {notifUnread > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent" />}
          </Link>
          <div className="w-7 h-7 rounded-full overflow-hidden relative border border-highlight/50">
            <Image
              src="/images/hero/hero_model.jpg"
              alt="Admin"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-inverse text-on-primary flex flex-col h-full z-50 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-inverse-line pb-4">
              <Image
                src="/images/brand/saffronvastra-wordmark.png"
                alt="SaffronVastra Admin"
                width={900}
                height={159}
                className="h-5 w-auto invert select-none"
              />
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-on-primary" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);

                return (
                  <div key={item.label} className="space-y-0.5">
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs ${
                        isActive ? "bg-secondary text-on-primary font-medium" : "text-on-primary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.href === "/admin/returns" && returnsOpen > 0 && (
                        <span
                          data-testid="returns-badge"
                          aria-label={`${returnsOpen} requests waiting for review`}
                          className="ml-auto text-[10px] font-semibold bg-primary text-on-primary rounded-full px-1.5 py-0.5 leading-none"
                        >
                          {returnsOpen}
                        </span>
                      )}
                      {item.href === "/admin/inbox" && inboxNew > 0 && (
                        <span
                          aria-label={`${inboxNew} new messages`}
                          className="ml-auto text-[10px] font-semibold bg-primary text-on-primary rounded-full px-1.5 py-0.5 leading-none"
                        >
                          {inboxNew}
                        </span>
                      )}
                    </Link>
                    {item.children && isActive && (
                      <div className="ml-6 pl-2.5 border-l border-inverse-line/60 space-y-1 my-1">
                        {item.children.map((child) => {
                          const isChildActive =
                            child.href === "/admin/products"
                              ? pathname === "/admin/products" || pathname === "/admin/products/new"
                              : pathname?.startsWith(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                                isChildActive
                                  ? "text-highlight font-semibold bg-on-inverse/10"
                                  : "text-on-inverse-muted hover:text-on-primary"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-inverse-line">
              <Link
                href="/"
                className="flex items-center gap-2 text-xs text-highlight"
              >
                <LogOut className="w-4 h-4" />
                <span>Return to Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas lg:pl-64">
        {/* Desktop Global Topbar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-canvas border-b border-line sticky top-0 z-20">
          {/* Universal Search Bar */}
          <div className="relative w-96">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search orders, customers, products, or order ID..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-full text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-6">
            <Link
              href="/admin/notifications"
              className="relative p-2 rounded-full hover:bg-ink/5 transition-colors text-ink-secondary"
              aria-label={notifUnread > 0 ? `Notifications, ${notifUnread} unread` : "Notifications"}
            >
              <Bell className="w-4 h-4" />
              {notifUnread > 0 && (
                <span data-testid="bell-count" className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                  {notifUnread > 99 ? "99+" : notifUnread}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 pl-4 border-l border-line">
              <div className="w-8 h-8 rounded-full overflow-hidden relative border border-line">
                <Image
                  src="/images/hero/hero_model.jpg"
                  alt={adminName || "Administrator"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-ink block leading-tight">
                  {adminName || "Administrator"}
                </span>
                <span className="text-[10px] text-ink-muted block">Admin</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
