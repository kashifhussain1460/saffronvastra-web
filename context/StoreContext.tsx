"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Product, CartItem, Size, ProductColor } from "@/types";
import { analytics } from "@/lib/analytics";
import { useSiteSettings } from "@/context/SettingsContext";

export interface AppliedPromo {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
  tier?: string;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, size?: Size, color?: ProductColor, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  appliedPromo: AppliedPromo | null;
  promoChecking: boolean;
  promoDiscount: number;
  applyPromo: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromo: () => void;
  freeShippingThreshold: number;
  shippingFee: number;
  finalTotal: number;
  syncCartWithBackend: () => Promise<void>;
  user: UserProfile | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const siteSettings = useSiteSettings();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  // Reactive Customer Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Cache resolved variant IDs by "slug_size"
  const variantCache = useRef<Record<string, string>>({});
  const PROMO_STORAGE_KEY = "saffron_promo_code";

  // Query authenticated customer profile from backend /api/v1/me
  const refreshUser = async (): Promise<UserProfile | null> => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/v1/me", { credentials: "include" });
      if (res.ok) {
        const body = await res.json();
        const rawUser = body.data;
        if (rawUser && rawUser.email) {
          const profile: UserProfile = {
            id: rawUser.id,
            email: rawUser.email,
            fullName: rawUser.fullName || "Valued Customer",
            phone: rawUser.phone || "",
            roles: Array.isArray(rawUser.roles) ? rawUser.roles : ["CUSTOMER"],
            tier: rawUser.tier || "Circle Member",
          };
          setUser(profile);
          setIsAuthenticated(true);
          try {
            localStorage.setItem("saffron_user", JSON.stringify(profile));
          } catch {}
          return profile;
        }
      }
      setUser(null);
      setIsAuthenticated(false);
      try {
        localStorage.removeItem("saffron_user");
      } catch {}
      return null;
    } catch (err) {
      // In offline / network partitioned mode, consult existing patron cache
      try {
        const cached = localStorage.getItem("saffron_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          setIsAuthenticated(true);
          return parsed;
        }
      } catch {}
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out customer, clear cookies, and trigger reactive UI refresh
  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("[StoreContext] Logout API error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      try {
        localStorage.removeItem("saffron_user");
        localStorage.removeItem("saffron_client_user");
      } catch {}
      // Clear session cookie on browser edge
      document.cookie = "saffron_session=; Max-Age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("saffron:auth-change"));
        window.location.href = "/auth/login";
      }
    }
  };

  // Bootstrap guest session if no guest identity exists
  const ensureGuestIdentity = async () => {
    try {
      let gid = localStorage.getItem("saffron_guest_id");
      if (!gid) {
        const res = await fetch("/api/v1/guest/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const body = await res.json();
          if (body.data?.guestId) {
            gid = body.data.guestId;
            localStorage.setItem("saffron_guest_id", gid!);
          }
        }
      }
      return gid;
    } catch {
      return null;
    }
  };

  // Synchronize cart with live backend API while preserving smooth fallback
  const syncCartWithBackend = async () => {
    try {
      const gid = localStorage.getItem("saffron_guest_id");
      const headers: Record<string, string> = {};
      if (gid) headers["x-guest-id"] = gid;

      const res = await fetch("/api/v1/cart", {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const serverItems = data.data?.items;
        if (Array.isArray(serverItems)) {
          if (serverItems.length > 0) {
            const mapped: CartItem[] = serverItems.map((it: any) => {
              // Built from what the server stored for this cart line, never from a built-in product list.
              const slug = it.product?.slug || "";
              const colour = {
                name: it.variant?.colourName || "",
                hex: it.variant?.colourHex || "#1A1A1A",
              };
              const size = (it.variant?.size || "") as Size;
              const localProduct: Product = {
                id: it.product?.id || `prod-${it.variantId}`,
                slug,
                title: it.product?.title || "",
                price: (it.unitPriceMinor || 0) / 100,
                description: "",
                details: [],
                leadTime: it.product?.leadTimeDays ? `${it.product.leadTimeDays} business days` : "",
                category: "",
                collection: "",
                rating: 0,
                reviewCount: 0,
                images: [it.product?.image || "/images/brand/saffronvastra-mark.png"],
                sizes: size ? [size] : [],
                colors: [colour],
                availabilityMode: "Made to Order" as const,
                fabric: "Velvet" as const,
                embroideryStyle: "Traditional" as const,
                occasion: "Festive" as const,
              };

              return {
                id: it.id,
                product: localProduct,
                size,
                color: colour,
                quantity: it.quantity,
                variantId: it.variantId || it.variant?.id,
              };
            });
            setCart(mapped);
            try {
              localStorage.setItem("saffron_cart", JSON.stringify(mapped));
            } catch {}
            return;
          } else {
            // Server cart is canonically empty
            setCart([]);
            try {
              localStorage.setItem("saffron_cart", JSON.stringify([]));
            } catch {}
            return;
          }
        }
      }
    } catch (err) {
      console.warn("[StoreContext] Backend unreachable, using local storage cart:", err);
    }

    // Fallback: load from localStorage if offline
    try {
      const savedCart = localStorage.getItem("saffron_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } catch {}
  };

  // Initialize from backend or localStorage on mount
  useEffect(() => {
    // 1. Authenticated customer session check
    refreshUser();

    // 2. Guest identity bootstrap & server-side cart synchronization
    ensureGuestIdentity().finally(() => {
      syncCartWithBackend();
    });

    const handleSyncEvent = () => {
      syncCartWithBackend();
    };
    const handleAuthEvent = () => {
      refreshUser();
      syncCartWithBackend();
    };

    window.addEventListener("saffron:sync-cart", handleSyncEvent);
    window.addEventListener("saffron:auth-change", handleAuthEvent);

    // Wishlist initialization
    try {
      const savedWishlist = localStorage.getItem("saffron_wishlist_v2");
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        } else {
          setWishlist([]);
        }
      } else {
        setWishlist([]);
      }
    } catch {
      setWishlist([]);
    }
    setMounted(true);

    return () => {
      window.removeEventListener("saffron:sync-cart", handleSyncEvent);
      window.removeEventListener("saffron:auth-change", handleAuthEvent);
    };
  }, []);

  // Save changes to localStorage for offline persistence
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem("saffron_cart", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, mounted]);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem("saffron_wishlist_v2", JSON.stringify(wishlist));
      } catch {}
    }
  }, [wishlist, mounted]);

  const addToCart = (product: Product, size?: Size, color?: ProductColor, quantity = 1) => {
    const selectedSize = size || product.sizes[0] || "M";
    const selectedColor = color || product.colors[0] || { name: "Default", hex: "#000000" };
    const tempId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.size === selectedSize &&
          item.color.name === selectedColor.name
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const newItem: CartItem = {
        id: tempId,
        product,
        size: selectedSize,
        color: selectedColor,
        quantity,
      };
      return [...prev, newItem];
    });

    try {
      analytics.trackAddToCart(
        product.id,
        undefined,
        product.title,
        quantity,
        product.price * 100
      );
    } catch {}

    setIsCartOpen(true);

    // Asynchronously synchronize with live backend cart
    (async () => {
      try {
        const cacheKey = `${product.slug}_${selectedSize}`;
        let variantId = variantCache.current[cacheKey];

        if (!variantId) {
          const prodRes = await fetch(`/api/v1/products/${product.slug}`, { credentials: "include" });
          if (prodRes.ok) {
            const pData = await prodRes.json();
            const variants = pData.data?.variants || [];
            const match =
              variants.find(
                (v: any) =>
                  v.size === selectedSize &&
                  (v.colourName === selectedColor.name || !selectedColor.name)
              ) ||
              variants.find((v: any) => v.size === selectedSize) ||
              variants[0];
            if (match) {
              variantId = match.id;
              variantCache.current[cacheKey] = match.id;
            }
          }
        }

        if (variantId) {
          const addRes = await fetch("/api/v1/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ variantId, quantity }),
          });
          if (addRes.ok) {
            const addData = await addRes.json();
            const serverItems = addData.data?.items;
            if (Array.isArray(serverItems) && serverItems.length > 0) {
              const matchedServerItem = serverItems.find((si: any) => si.variantId === variantId);
              if (matchedServerItem) {
                setCart((prev) =>
                  prev.map((ci) =>
                    ci.id === tempId ||
                    (ci.product.slug === product.slug && ci.size === selectedSize)
                      ? { ...ci, id: matchedServerItem.id, variantId: matchedServerItem.variantId }
                      : ci
                  )
                );
              }
            }
          }
        }
      } catch (err) {
        console.warn("[StoreContext] Live cart sync exception, preserved local fallback:", err);
      }
    })();
  };

  const removeFromCart = (itemId: string) => {
    const itemToRemove = cart.find((i) => i.id === itemId);
    if (itemToRemove) {
      try {
        analytics.trackRemoveFromCart(
          itemToRemove.product.id,
          undefined,
          itemToRemove.quantity
        );
      } catch {}
    }
    setCart((prev) => prev.filter((item) => item.id !== itemId));

    // Async backend call with UUID format verification
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
    if (isUuid) {
      fetch(`/api/v1/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    let targetNewQty = 0;
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            targetNewQty = newQty;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );

    // Async backend call with UUID format verification
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
    if (isUuid) {
      if (targetNewQty > 0) {
        fetch(`/api/v1/cart/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ quantity: targetNewQty }),
        }).catch(() => {});
      } else {
        fetch(`/api/v1/cart/items/${itemId}`, {
          method: "DELETE",
          credentials: "include",
        }).catch(() => {});
      }
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearCart = () => {
    setCart([]);
    // an order has been placed: the promo code belonged to it
    setAppliedPromo(null);
    try {
      localStorage.removeItem(PROMO_STORAGE_KEY);
    } catch {}
    fetch("/api/v1/cart", {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});
  };

  // Promo codes are checked by the server (it knows the live coupons and the rules for each).
  const applyPromo = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Please enter a valid promo code." };
    }
    try {
      const items = cart
        .filter((ci) => ci.variantId)
        .map((ci) => ({ variantId: ci.variantId!, quantity: ci.quantity }));
      const res = await fetch("/api/v1/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ couponCode: cleanCode, items: items.length > 0 ? items : undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, message: body?.message || "We could not check this promo code. Please try again." };
      }
      const c = body?.data?.coupon;
      if (!c) return { success: false, message: "This promo code is not valid." };
      const percent = c.type === "PERCENTAGE";
      const pct = c.value > 100 ? c.value / 100 : c.value;
      const discountValue = percent ? pct : c.value / 100;
      const description =
        c.description || (percent ? `${pct}% off your order` : `₹${discountValue.toLocaleString("en-IN")} off your order`);
      setAppliedPromo({ code: c.code, discountType: percent ? "percent" : "fixed", discountValue, description });
      try {
        localStorage.setItem(PROMO_STORAGE_KEY, c.code);
      } catch {}
      return { success: true, message: `Promo code ${c.code} applied.` };
    } catch {
      return { success: false, message: "Network error. Please check your connection and try again." };
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    try {
      localStorage.removeItem(PROMO_STORAGE_KEY);
    } catch {}
  };

  // A promo code applied earlier survives a reload or a new tab: it is checked again with the server once the cart
  // is known, and dropped if it no longer applies (expired, used up, below the minimum).
  const promoRestoreTried = useRef(false);
  // true while a remembered code is being re-checked: checkout waits, so an order never skips a shown discount
  const [promoChecking, setPromoChecking] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(PROMO_STORAGE_KEY)) setPromoChecking(true);
    } catch {}
  }, []);
  useEffect(() => {
    if (promoRestoreTried.current || appliedPromo || cart.length === 0) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(PROMO_STORAGE_KEY);
    } catch {}
    promoRestoreTried.current = true;
    if (!stored) {
      setPromoChecking(false);
      return;
    }
    void applyPromo(stored)
      .then((result) => {
        if (!result.success) {
          try {
            localStorage.removeItem(PROMO_STORAGE_KEY);
          } catch {}
        }
      })
      .finally(() => setPromoChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, appliedPromo]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const promoDiscount = appliedPromo
    ? appliedPromo.discountType === "percent"
      ? Math.round((cartTotal * appliedPromo.discountValue) / 100)
      : Math.min(appliedPromo.discountValue, cartTotal)
    : 0;

  const freeShippingThreshold = siteSettings.shipping.freeShippingThreshold;
  const shippingFee = cartTotal >= freeShippingThreshold || cartTotal === 0 ? 0 : siteSettings.shipping.flatFee;
  const finalTotal = Math.max(0, cartTotal - promoDiscount + shippingFee);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        wishlist,
        toggleWishlist,
        isInWishlist,
        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        searchQuery,
        setSearchQuery,
        appliedPromo,
        promoChecking,
        promoDiscount,
        applyPromo,
        removePromo,
        freeShippingThreshold,
        shippingFee,
        finalTotal,
        syncCartWithBackend,
        user,
        isAuthenticated,
        authLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
