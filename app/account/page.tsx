"use client";

import { BRAND } from "@/lib/brand";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useProductsByIds } from "@/lib/useProductsByIds";
import PriceTag from "@/components/ui/PriceTag";
import AccountShell, { DASHBOARD_TABS, type AccountSection } from "@/components/account/AccountShell";
import OrdersTable from "@/components/account/OrdersTable";
import {
  btnPrimary,
  btnSmall,
  btnSmallOutline,
  inputClass,
  labelClass,
  sectionTitle,
  textareaClass,
} from "@/components/auth/ui";
import { Package, MapPin, Heart, CreditCard, Star, ShoppingBag, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface AccountOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: "Delivered" | "Processing" | "Shipped" | "Cancelled";
  itemsSummary: string;
  itemCount: number;
  itemImage: string;
  itemTitle: string;
  itemMeta: string;
  total: number;
}

const mapAddress = (a: any) => ({
  id: a.id,
  isDefault: Boolean(a.isDefault),
  name: a.fullName,
  tag: a.isDefault ? "Default" : "Saved",
  street: a.street,
  locality: a.apartment || "",
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  phone: a.phone,
});

const EMPTY_ADDRESS = { fullName: "", phone: "", street: "", apartment: "", city: "", state: "", pincode: "", isDefault: false };

export default function AccountDashboardPage() {
  const { wishlist, cart, addToCart } = useStore();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "orders" | "addresses" | "wishlist" | "profile" | "payment" | "reviews" | "notifications"
  >("dashboard");

  // My Reviews (real, from the API)
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [reviewsState, setReviewsState] = useState<"loading" | "ready" | "error">("loading");
  const [reviewsMessage, setReviewsMessage] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, title: "", body: "" });
  const [reviewError, setReviewError] = useState("");

  const loadMyReviews = async () => {
    setReviewsState("loading");
    try {
      const res = await fetch("/api/v1/me/reviews", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setMyReviews((await res.json()).items ?? []);
      setReviewsState("ready");
    } catch {
      setReviewsState("error");
    }
  };

  useEffect(() => {
    if (activeTab === "reviews") void loadMyReviews();
  }, [activeTab]);

  const saveMyReview = async (id: string) => {
    setReviewError("");
    try {
      const res = await fetch(`/api/v1/me/reviews/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewDraft.rating, title: reviewDraft.title, body: reviewDraft.body }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) return setReviewError(json?.message || "Your review could not be saved.");
      setEditingReviewId(null);
      setReviewsMessage("Saved. Your review will appear after moderation.");
      await loadMyReviews();
    } catch {
      setReviewError("Network error. Please try again.");
    }
  };

  const deleteMyReview = async (id: string) => {
    setReviewsMessage("");
    try {
      const res = await fetch(`/api/v1/me/reviews/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) return setReviewsMessage("Your review could not be deleted.");
      setReviewsMessage("Review deleted.");
      await loadMyReviews();
    } catch {
      setReviewsMessage("Network error. Please try again.");
    }
  };

  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersError, setOrdersError] = useState("");

  // Orders come from the API only. A browser-side copy is never merged in, and nothing is invented.
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/v1/me/orders", { credentials: "include" });
        if (!res.ok) {
          setOrdersError("We could not load your orders right now.");
          return;
        }
        const resData = await res.json();
        const list: any[] = Array.isArray(resData.data) ? resData.data : [];
        setOrders(
          list.map((so: any) => ({
            id: so.id,
            orderNumber: so.orderNumber,
            date: so.createdAt
              ? new Date(so.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
              : "",
            status: (so.status || "") as any,
            itemsSummary: `${so.itemsCount ?? so.items?.length ?? 0} ${(so.itemsCount ?? so.items?.length) === 1 ? "item" : "items"}`,
            itemCount: Number(so.itemsCount ?? so.items?.length ?? 0),
            itemImage: so.items?.[0]?.productImage || "/images/brand/saffronvastra-mark.png",
            itemTitle: so.items?.[0]?.productTitle || "",
            itemMeta: [so.items?.[0]?.size && `Size: ${so.items[0].size}`, so.items?.[0]?.quantity && `Qty: ${so.items[0].quantity}`]
              .filter(Boolean)
              .join(" | "),
            total: (so.totalMinor || 0) / 100,
          }))
        );
        setOrdersError("");
      } catch (err) {
        console.warn("[Account] Live orders fetch exception:", err);
        setOrdersError("We could not load your orders right now.");
      }
    };

    const fetchProfileAndAddresses = async () => {
      try {
        if (typeof window !== "undefined") {
          const local = localStorage.getItem("saffron_user");
          if (local) {
            const parsed = JSON.parse(local);
            setUserProfile((prev) => ({
              ...prev,
              fullName: parsed.name || prev.fullName,
              email: parsed.email || prev.email,
              phone: parsed.phone || prev.phone,
              tier: parsed.tier || prev.tier,
            }));
          }
        }

        const meRes = await fetch("/api/v1/me", { credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.data) {
            setUserProfile({
              fullName: meData.data.fullName || "Atelier Patron",
              email: meData.data.email || "",
              phone: meData.data.phone || "",
              tier: meData.data.tier || "Circle Member",
            });
            if (Array.isArray(meData.data.addresses)) {
              setAddresses(meData.data.addresses.map(mapAddress));
            }
          }
        }
      } catch (err) {
        console.warn("[Account] Profile fetch exception:", err);
      }
    };

    fetchOrders();
    fetchProfileAndAddresses();
  }, []);

  // Customer Profile State
  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
    tier: string;
  }>({
    fullName: "Atelier Patron",
    email: "",
    phone: "",
    tier: "Circle Member",
  });

  // Wishlist preview items derived from real saved wishlist
  const { products: wishlistItems } = useProductsByIds(wishlist);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const firstError = (body: any, fallback: string) =>
    body?.message || body?.errors?.[0]?.message || fallback;

  // Saved through PATCH /me; the page shows success only after the server accepted the change.
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (profileSaving) return;
    const data = new FormData(e.currentTarget);
    const displayName = `${String(data.get("firstName") || "").trim()} ${String(data.get("lastName") || "").trim()}`.trim();
    const phone = String(data.get("phone") || "").trim();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName, phone }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setProfileMessage({ text: firstError(body, "Your details could not be saved."), isError: true });
        return;
      }
      setUserProfile((prev) => ({ ...prev, fullName: body?.data?.displayName || displayName, phone: body?.data?.phone ?? phone }));
      setProfileMessage({ text: "Your details were saved.", isError: false });
    } catch {
      setProfileMessage({ text: "Network error: your details were not saved.", isError: true });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addressSaving) return;
    setAddressSaving(true);
    setAddressError("");
    try {
      const res = await fetch("/api/v1/me/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...addressForm, apartment: addressForm.apartment || undefined, country: "India" }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data) {
        setAddressError(firstError(body, "The address could not be saved."));
        return;
      }
      setAddresses((prev) => [mapAddress(body.data), ...(body.data.isDefault ? prev.map((a) => ({ ...a, isDefault: false, tag: "Saved" })) : prev)]);
      setAddressForm(EMPTY_ADDRESS);
      setAddressFormOpen(false);
    } catch {
      setAddressError("Network error: the address was not saved.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    if (!window.confirm("Remove this address?")) return;
    setAddressError("");
    try {
      const res = await fetch(`/api/v1/me/addresses/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setAddressError(firstError(body, "The address could not be removed."));
        return;
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setAddressError("Network error: the address was not removed.");
    }
  };

  const [addedItemToast, setAddedItemToast] = useState<string | null>(null);

  const handleQuickAdd = (product: any) => {
    addToCart(product, product.sizes?.[0] || "M", product.colors?.[0]);
    setAddedItemToast(product.title);
    setTimeout(() => setAddedItemToast(null), 2500);
  };

  // The sidebar on other account pages links to /account#<tab>; open that tab here.
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "") as AccountSection;
      if (DASHBOARD_TABS.includes(id)) setActiveTab(id as typeof activeTab);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const selectTab = (section: AccountSection) => {
    if (!DASHBOARD_TABS.includes(section)) return;
    setActiveTab(section as typeof activeTab);
    try {
      window.history.replaceState(window.history.state, "", section === "dashboard" ? "/account" : `/account#${section}`);
    } catch {}
  };

  const firstName = userProfile.fullName.trim().split(" ")[0];
  const tabTitle: Record<string, string> = {
    dashboard: "Dashboard",
    addresses: "Addresses",
    profile: "Profile Details",
    payment: "Payment Methods",
    reviews: "My Reviews",
  };

  return (
    <AccountShell
      title="My Account"
      crumbs={[{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: tabTitle[activeTab] || "Dashboard" }]}
      active={activeTab}
      onSelect={selectTab}
      profile={{ name: userProfile.fullName, email: userProfile.email }}
    >
      {/* Toast Notification */}
      {addedItemToast && (
        <div role="status" className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-50 bg-inverse text-on-inverse px-5 py-3 rounded-lg shadow-luxury flex items-center gap-3 text-sm max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
          <span>Added <strong>{addedItemToast}</strong> to your bag!</span>
        </div>
      )}

      <div className="space-y-12">
        {/* Tab: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <>
            <div>
              <h2 className={sectionTitle}>
                Welcome back{firstName && userProfile.fullName !== "Atelier Patron" ? `, ${firstName}` : ""}!
              </h2>
              <p className="mt-2 text-base text-ink-secondary leading-relaxed">
                Here you can manage your orders, addresses, profile and more.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/account/orders"
                  className="group rounded-2xl border border-line p-5 flex items-center gap-4 hover:border-ink transition-colors"
                >
                  <span className="w-12 h-12 shrink-0 rounded-full bg-surface-muted flex items-center justify-center text-ink">
                    <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-heading text-[28px] leading-none font-medium text-ink">{orders.length}</span>
                    <span className="mt-1 block text-sm text-ink-secondary">Total Orders</span>
                  </span>
                </Link>

                <Link
                  href="/account/wishlist"
                  className="group rounded-2xl border border-line p-5 flex items-center gap-4 hover:border-ink transition-colors"
                >
                  <span className="w-12 h-12 shrink-0 rounded-full bg-surface-muted flex items-center justify-center text-ink">
                    <Heart className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-heading text-[28px] leading-none font-medium text-ink">{wishlist.length}</span>
                    <span className="mt-1 block text-sm text-ink-secondary">Wishlist Items</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => selectTab("addresses")}
                  className="group rounded-2xl border border-line p-5 flex items-center gap-4 text-left hover:border-ink transition-colors"
                >
                  <span className="w-12 h-12 shrink-0 rounded-full bg-surface-muted flex items-center justify-center text-ink">
                    <MapPin className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-heading text-[28px] leading-none font-medium text-ink">{addresses.length}</span>
                    <span className="mt-1 block text-sm text-ink-secondary whitespace-nowrap">Saved Addresses</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className={sectionTitle}>Recent Orders</h2>
                <Link
                  href="/account/orders"
                  className="text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
                >
                  View All
                </Link>
              </div>

              {ordersError ? (
                <p role="alert" className="rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error">
                  {ordersError}
                </p>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-line p-8 text-center space-y-3">
                  <Package className="w-10 h-10 mx-auto text-ink-muted" strokeWidth={1.25} aria-hidden="true" />
                  <p className="font-heading text-xl font-medium text-ink">No Bespoke Orders Yet</p>
                  <p className="text-base text-ink-secondary max-w-sm mx-auto">
                    Your bespoke commissions and purchases will be showcased here once placed.
                  </p>
                  <div className="pt-2">
                    <Link href="/collections" className={btnPrimary}>
                      Explore Collections
                    </Link>
                  </div>
                </div>
              ) : (
                <OrdersTable
                  caption="Your three most recent orders"
                  rows={orders.slice(0, 3).map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    date: o.date,
                    status: o.status,
                    total: o.total,
                    itemCount: o.itemCount,
                  }))}
                />
              )}
            </div>

            {/* Your Wishlist */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className={sectionTitle}>Your Wishlist</h2>
                <Link
                  href="/account/wishlist"
                  className="text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
                >
                  View All
                </Link>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="rounded-2xl border border-line p-8 text-center space-y-3">
                  <Heart className="w-10 h-10 mx-auto text-ink-muted" strokeWidth={1.25} aria-hidden="true" />
                  <p className="font-heading text-xl font-medium text-ink">Your Wishlist is Empty</p>
                  <p className="text-base text-ink-secondary max-w-sm mx-auto">
                    Save pieces you adore to curate your royal bespoke wardrobe.
                  </p>
                  <div className="pt-2">
                    <Link href="/collections" className={btnPrimary}>
                      Discover Pieces
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                  {wishlistItems.map((item) => (
                    <li key={item.id} className="group">
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-muted">
                        <Link href={`/products/${item.slug}`} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
                          <Image
                            src={item.images[0] || "/images/products/maroon_jacket.jpg"}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 50vw, 220px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item)}
                          className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-surface text-ink shadow-card flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"
                          aria-label={`Add ${item.title} to bag`}
                          title="Add to Bag"
                        >
                          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="mt-3 block text-base text-ink hover:text-primary-hover line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <PriceTag price={item.price} compareAtPrice={item.compareAtPrice} size="md" className="mt-1" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Tab: ADDRESSES */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={sectionTitle}>Saved Delivery Addresses</h2>
                <p className="mt-1 text-base text-ink-secondary">
                  Manage your atelier shipping destinations and billing addresses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddressError("");
                  setAddressFormOpen((open) => !open);
                }}
                aria-expanded={addressFormOpen}
                className={btnSmall}
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Add New Address
              </button>
            </div>

            {addressError && (
              <p role="alert" className="rounded-lg border border-error-line bg-error-bg px-4 py-3 text-sm text-error">
                {addressError}
              </p>
            )}

            {addressFormOpen && (
              <form onSubmit={handleAddressSubmit} className="rounded-2xl border border-line p-5 sm:p-6 space-y-5">
                <h3 className="font-heading text-xl font-medium text-ink">New delivery address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                  {([
                    ["fullName", "Full name", "text", true, "name"],
                    ["phone", "Phone", "tel", true, "tel"],
                    ["street", "Street address", "text", true, "address-line1"],
                    ["apartment", "Apartment, suite (optional)", "text", false, "address-line2"],
                    ["city", "City", "text", true, "address-level2"],
                    ["state", "State", "text", true, "address-level1"],
                    ["pincode", "PIN code", "text", true, "postal-code"],
                  ] as const).map(([key, label, type, required, autoComplete]) => (
                    <label key={key} className="block">
                      <span className={labelClass}>{label}</span>
                      <input
                        type={type}
                        required={required}
                        autoComplete={autoComplete}
                        value={addressForm[key]}
                        onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                        className={inputClass()}
                      />
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-3 text-base text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-[18px] h-[18px] accent-primary"
                  />
                  Make this my default address
                </label>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button type="submit" disabled={addressSaving} className={btnPrimary}>
                    {addressSaving ? "Saving..." : "Save address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressFormOpen(false)}
                    className="min-h-[44px] text-base font-semibold text-ink underline underline-offset-2 hover:text-primary-hover"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <div className="rounded-2xl border border-line p-8 text-center space-y-3">
                <MapPin className="w-10 h-10 mx-auto text-ink-muted" strokeWidth={1.25} aria-hidden="true" />
                <p className="font-heading text-xl font-medium text-ink">No Saved Delivery Addresses</p>
                <p className="text-base text-ink-secondary max-w-sm mx-auto">
                  Add a shipping address for expedited atelier checkout and bespoke delivery.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`relative rounded-2xl border p-6 text-center ${addr.isDefault ? "border-ink" : "border-line"}`}
                  >
                    <h3 className="font-heading text-xl font-medium text-ink">{addr.isDefault ? "Default" : addr.tag}</h3>
                    <div className="mt-4 text-base text-ink leading-relaxed">
                      <p>{addr.name}</p>
                      <p>{addr.street}</p>
                      {addr.locality && <p>{addr.locality}</p>}
                      <p>
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-ink-secondary">Phone: {addr.phone}</p>
                    </div>
                    <div className="mt-5 flex justify-center">
                      <button type="button" onClick={() => handleRemoveAddress(addr.id)} className={btnSmall}>
                        <Trash2 className="w-4 h-4" aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: PROFILE DETAILS */}
        {activeTab === "profile" && (
          <div>
            <h2 className={sectionTitle}>Profile Details</h2>
            <p className="mt-1 text-base text-ink-secondary">
              Update your personal contact information and communication preferences.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <label htmlFor="profile-firstName" className={labelClass}>First Name</label>
                  <input
                    id="profile-firstName"
                    type="text"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    defaultValue={userProfile.fullName.split(" ")[0] || ""}
                    key={`fn-${userProfile.fullName}`}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label htmlFor="profile-lastName" className={labelClass}>Last Name</label>
                  <input
                    id="profile-lastName"
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    defaultValue={userProfile.fullName.split(" ").slice(1).join(" ") || ""}
                    key={`ln-${userProfile.fullName}`}
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label htmlFor="profile-email" className={labelClass}>Email Address</label>
                  <input
                    id="profile-email"
                    type="email"
                    readOnly
                    aria-describedby="profile-email-hint"
                    defaultValue={userProfile.email}
                    key={`em-${userProfile.email}`}
                    className={inputClass()}
                  />
                  <p id="profile-email-hint" className="mt-1.5 text-sm text-ink-muted">
                    Your email is your sign-in and cannot be changed here.
                  </p>
                </div>

                <div>
                  <label htmlFor="profile-phone" className={labelClass}>Mobile Number</label>
                  <input
                    id="profile-phone"
                    type="tel"
                    name="phone"
                    maxLength={20}
                    autoComplete="tel"
                    defaultValue={userProfile.phone}
                    key={`ph-${userProfile.phone}`}
                    className={inputClass()}
                  />
                </div>
              </div>

              {profileMessage && (
                <p
                  role={profileMessage.isError ? "alert" : "status"}
                  className={`text-sm ${profileMessage.isError ? "text-error" : "text-success"}`}
                >
                  {profileMessage.text}
                </p>
              )}

              <button type="submit" disabled={profileSaving} className={btnPrimary}>
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Tab: PAYMENT METHODS */}
        {activeTab === "payment" && (
          <div>
            <h2 className={sectionTitle}>Payment Methods</h2>
            <p className="mt-1 text-base text-ink-secondary">Saved cards and UPI handles for quick made-to-order checkout.</p>
            <div className="mt-6 rounded-2xl border border-line p-6 flex items-start gap-4">
              <CreditCard className="w-6 h-6 shrink-0 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-base text-ink-secondary">
                No payment methods are saved on your account. You choose how to pay each time you check out.
              </p>
            </div>
          </div>
        )}

        {/* Tab: REVIEWS */}
        {activeTab === "reviews" && (
          <div>
            <h2 className={sectionTitle}>My Reviews</h2>
            <p className="mt-1 text-base text-ink-secondary">Reviews you have submitted for your handcrafted pieces.</p>

            <div className="mt-6 space-y-4">
              {reviewsState === "loading" && (
                <p role="status" className="text-base text-ink-secondary">Loading your reviews...</p>
              )}
              {reviewsState === "error" && (
                <p role="alert" className="text-base text-error">
                  Your reviews could not be loaded.{" "}
                  <button type="button" className="underline font-semibold min-h-[44px]" onClick={() => void loadMyReviews()}>
                    Try again
                  </button>
                </p>
              )}
              {reviewsMessage && <p role="status" className="text-sm text-success">{reviewsMessage}</p>}
              {reviewsState === "ready" && myReviews.length === 0 && (
                <div className="rounded-2xl border border-line p-6 flex items-start gap-4">
                  <Star className="w-6 h-6 shrink-0 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-base text-ink-secondary">
                    You have not reviewed any pieces yet. Once an order is delivered you can review it from its product page.
                  </p>
                </div>
              )}
              <ul className="space-y-4">
                {myReviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line p-5 sm:p-6 space-y-3" data-testid="my-review">
                    <div className="flex items-start justify-between gap-3">
                      {r.product ? (
                        <Link href={`/products/${r.product.slug}`} className="font-heading text-lg font-medium text-ink hover:text-primary-hover">
                          {r.product.title}
                        </Link>
                      ) : (
                        <span className="font-heading text-lg font-medium">Piece</span>
                      )}
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-line font-semibold text-ink-secondary">
                        {r.status === "Pending" ? "Awaiting moderation" : r.status}
                      </span>
                    </div>
                    {editingReviewId === r.id ? (
                      <form
                        className="space-y-4"
                        noValidate
                        onSubmit={(e) => {
                          e.preventDefault();
                          void saveMyReview(r.id);
                        }}
                      >
                        <div>
                          <label className={labelClass} htmlFor={`rv-rating-${r.id}`}>Rating</label>
                          <select
                            id={`rv-rating-${r.id}`}
                            value={reviewDraft.rating}
                            onChange={(e) => setReviewDraft({ ...reviewDraft, rating: Number(e.target.value) })}
                            className={`${inputClass()} max-w-[200px]`}
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>
                                {n} {n === 1 ? "star" : "stars"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`rv-title-${r.id}`}>Title</label>
                          <input
                            id={`rv-title-${r.id}`}
                            maxLength={100}
                            value={reviewDraft.title}
                            onChange={(e) => setReviewDraft({ ...reviewDraft, title: e.target.value })}
                            className={inputClass()}
                          />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor={`rv-body-${r.id}`}>Review</label>
                          <textarea
                            id={`rv-body-${r.id}`}
                            rows={4}
                            maxLength={2000}
                            value={reviewDraft.body}
                            onChange={(e) => setReviewDraft({ ...reviewDraft, body: e.target.value })}
                            className={textareaClass}
                          />
                        </div>
                        {reviewError && <p role="alert" className="text-sm text-error">{reviewError}</p>}
                        <p className="text-sm text-ink-muted">After you save, the review is read again before it shows on the product page.</p>
                        <div className="flex flex-wrap gap-3">
                          <button type="submit" className={btnSmall}>Save</button>
                          <button type="button" onClick={() => setEditingReviewId(null)} className={btnSmallOutline}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="text-base text-highlight tracking-wide" aria-label={`${r.rating} out of 5 stars`}>
                          {"★".repeat(r.rating)}
                          <span className="text-line-strong">{"☆".repeat(5 - r.rating)}</span>
                        </p>
                        {r.title && <p className="text-base font-semibold text-ink">{r.title}</p>}
                        <p className="text-base text-ink-secondary whitespace-pre-line">{r.body}</p>
                        {r.reply && (
                          <p className="text-sm text-ink-secondary border-l-2 border-line-strong pl-3">
                            <span className="font-semibold">Reply from {BRAND.name}: </span>
                            {r.reply}
                          </p>
                        )}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReviewId(r.id);
                              setReviewDraft({ rating: r.rating, title: r.title || "", body: r.body });
                              setReviewError("");
                            }}
                            className={btnSmallOutline}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteMyReview(r.id)}
                            className={`${btnSmallOutline} text-error hover:text-error`}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AccountShell>
  );
}
