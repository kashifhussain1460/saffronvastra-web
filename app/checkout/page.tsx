"use client";

import { BRAND } from "@/lib/brand";
import { useSiteSettings } from "@/context/SettingsContext";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { analytics } from "@/lib/analytics";
import PageTitle from "@/components/checkout/PageTitle";
import { fieldClass, FieldLabel, FieldError } from "@/components/checkout/fields";
import PaymentMethodPicker, { type PaymentChoice } from "@/components/checkout/PaymentMethodPicker";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { ArrowLeft, Check, AlertCircle, X, ChevronDown } from "lucide-react";

// Same list as the API (backend/src/common/validators.ts): every state and union territory.
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    cartCount,
    appliedPromo,
    promoChecking,
    promoDiscount,
    clearCart,
    user,
    applyPromo,
    removePromo,
  } = useStore();

  // Voucher field in the summary (same server check as the cart page)
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim() || promoBusy) return;
    setPromoBusy(true);
    const res = await applyPromo(promoInput);
    setPromoBusy(false);
    setPromoMessage({ text: res.message, isError: !res.success });
    if (res.success) setPromoInput("");
  };
  const { shipping: shippingRules, store: storeInfo } = useSiteSettings();
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Live Backend Quote & Pricing
  const [liveQuote, setLiveQuote] = useState<{
    subtotal: number;
    discount: number;
    shipping: number;
    codFee: number;
    total: number;
    codEnabled: boolean;
    onlineEnabled: boolean;
  } | null>(null);
  // Payment method. Cash on Delivery is the default; the quote says which methods the shop currently offers.
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>("COD");
  // True while a quote request is running, so the button cannot place an order at a stale total.
  const [quoting, setQuoting] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setQuoting(true);
    const fetchQuote = async () => {
      try {
        const itemsPayload = cart
          .filter((ci) => ci.variantId)
          .map((ci) => ({ variantId: ci.variantId!, quantity: ci.quantity }));

        const res = await fetch("/api/v1/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            couponCode: appliedPromo?.code || undefined,
            shippingMethod,
            paymentProvider: paymentMethod,
            items: itemsPayload.length > 0 ? itemsPayload : undefined,
          }),
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.data) {
            setLiveQuote({
              subtotal: data.data.subtotalMinor / 100,
              discount: data.data.discountMinor / 100,
              shipping: data.data.shippingMinor / 100,
              codFee: (data.data.codFeeMinor || 0) / 100,
              total: data.data.totalMinor / 100,
              codEnabled: data.data.codEnabled !== false,
              onlineEnabled: data.data.onlineEnabled === true,
            });
          }
        }
      } catch (err) {
        // Smooth local fallback
      } finally {
        if (!isCancelled) setQuoting(false);
      }
    };
    fetchQuote();
    return () => {
      isCancelled = true;
    };
  }, [appliedPromo, shippingMethod, cart, paymentMethod]);

  // Without a quote (offline fallback) Cash on Delivery stays available, as it always was.
  const codEnabled = liveQuote ? liveQuote.codEnabled : true;
  const onlineEnabled = liveQuote ? liveQuote.onlineEnabled : false;
  const codFee = paymentMethod === "COD" && liveQuote ? liveQuote.codFee : 0;
  const noPaymentMethod = !codEnabled && !onlineEnabled;
  // Keep the selection on a method that is offered: COD when available, otherwise online.
  useEffect(() => {
    if (!liveQuote) return;
    if (paymentMethod === "COD" && !liveQuote.codEnabled && liveQuote.onlineEnabled) setPaymentMethod("CASHFREE");
    else if (paymentMethod === "CASHFREE" && !liveQuote.onlineEnabled && liveQuote.codEnabled) setPaymentMethod("COD");
  }, [liveQuote, paymentMethod]);

  const shippingCost = liveQuote !== null ? liveQuote.shipping : shippingMethod === "express" ? shippingRules.flatFee : cartTotal >= shippingRules.freeShippingThreshold ? 0 : shippingRules.flatFee;
  const effectivePromoDiscount = liveQuote !== null ? liveQuote.discount : promoDiscount;
  const finalTotal = liveQuote !== null ? liveQuote.total : Math.max(0, cartTotal - promoDiscount + shippingCost);

  // Form Fields
  const isAdminAccount = Boolean(user?.roles?.includes("ADMIN"));

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
    saveAddress: true,
    billingSameAsShipping: true,
    bespokeNotes: "",
    smsUpdates: true,
  });

  // Prefill from the signed-in customer's own profile and default address, once, without overwriting typing.
  const prefilled = React.useRef(false);
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    const [first, ...rest] = (user.fullName || "").trim().split(" ");
    setFormData((prev) => ({
      ...prev,
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
      firstName: prev.firstName || first || "",
      lastName: prev.lastName || rest.join(" "),
    }));
    fetch("/api/v1/me/addresses", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const addr = (body?.data || []).find((a: any) => a.isDefault) || body?.data?.[0];
        if (!addr) return;
        setFormData((prev) => ({
          ...prev,
          address: prev.address || addr.street || "",
          apartment: prev.apartment || addr.apartment || "",
          city: prev.city || addr.city || "",
          state: prev.state || addr.state || "",
          pincode: prev.pincode || addr.pincode || "",
          // the field holds the 10 digits after the fixed +91
          phone: prev.phone || String(addr.phone || "").replace(/\D/g, "").slice(-10),
        }));
      })
      .catch(() => undefined);
  }, [user]);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous guard: a fast double click cannot send a second order before React re-renders the disabled button.
  const submitLock = React.useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim() || !formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address.";
    }
    // Indian mobile numbers: 10 digits starting 6-9, optionally written with +91 or 0.
    const phoneDigits = formData.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Delivery address is required.";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!formData.state) {
      newErrors.state = "Select your state.";
    }
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6-digit PIN code.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    if (quoting || noPaymentMethod) return;
    if (cart.length === 0) {
      setErrors({ general: "Your shopping bag is currently empty. Please add items before checking out." });
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setErrors({});

    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let finalOrderNumber = "";

    try {
      const itemsPayload = cart
        .filter((ci) => ci.variantId)
        .map((ci) => ({ variantId: ci.variantId!, quantity: ci.quantity }));

      const checkoutPayload = {
        shippingAddress: {
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email.trim(),
          phone: formData.phone.startsWith("+91") ? formData.phone : `+91 ${formData.phone}`,
          street: formData.address,
          apartment: formData.apartment.trim() || undefined,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: "India",
        },
        paymentMethod: {
          provider: paymentMethod,
        },
        couponCode: appliedPromo?.code || undefined,
        shippingMethod,
        bespokeNotes: formData.bespokeNotes || undefined,
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
      };

      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        credentials: "include",
        body: JSON.stringify(checkoutPayload),
      });

      if (res.ok) {
        const resData = await res.json();
        const serverOrder = resData.data?.order;
        if (!serverOrder?.orderNumber) {
          setErrors({ general: "We could not confirm your order. Please check your orders before trying again." });
          setIsSubmitting(false);
        submitLock.current = false;
          window.scrollTo({ top: 120, behavior: "smooth" });
          return;
        }
        finalOrderNumber = serverOrder.orderNumber;

        // the cart is cleared once the order exists (not after payment): the order is saved either way
        if (paymentMethod === "CASHFREE") {
          clearCart();
          // The order is saved as Pending. Any problem opening the payment page leads to the confirmation page, which can retry.
          const goToOrder = () => router.push(`/order-confirmation?order=${encodeURIComponent(finalOrderNumber)}&payment=retry`);
          try {
            const startRes = await fetch(`/api/v1/orders/${encodeURIComponent(finalOrderNumber)}/payment/start`, {
              method: "POST",
              credentials: "include",
            });
            const startBody = startRes.ok ? await startRes.json().catch(() => null) : null;
            const started = startBody?.data;
            if (!started || started.alreadyPaid || !started.paymentSessionId) return goToOrder();
            await openCashfreeCheckout(started.paymentSessionId, started.mode === "production" ? "production" : "sandbox");
            // normally the browser has left for the payment page; keep the button locked in case it has not yet
            return;
          } catch {
            return goToOrder();
          }
        }

        try {
          analytics.trackOrderCompleted(finalOrderNumber, finalTotal * 100, cart.length, {
            paymentMethod: "cod",
            shippingState: formData.state,
          });
        } catch {}

        clearCart();
        setTimeout(() => {
          router.push(`/order-confirmation?orderId=${finalOrderNumber}`);
        }, 800);
        return;
      } else {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.message || "Failed to process bespoke purchase. Please check your details.";
        setErrors({ general: errMsg });
        setIsSubmitting(false);
        submitLock.current = false;
        window.scrollTo({ top: 120, behavior: "smooth" });
        return;
      }
    } catch (err: any) {
      console.error("[Checkout] Order processing connection failure:", err);
      setErrors({
        general:
          "Unable to securely establish a connection with the Jaipur atelier processing server. Your payment has not been processed. Please verify your connection or try again shortly.",
      });
      setIsSubmitting(false);
        submitLock.current = false;
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };


  const field = (
    name: keyof typeof formData,
    opts: {
      type?: string;
      placeholder?: string;
      autoComplete?: string;
      maxLength?: number;
      inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    } = {}
  ) => (
    <input
      type={opts.type || "text"}
      id={name}
      name={name}
      value={formData[name] as string}
      onChange={handleInputChange}
      placeholder={opts.placeholder}
      autoComplete={opts.autoComplete}
      maxLength={opts.maxLength}
      inputMode={opts.inputMode}
      aria-invalid={errors[name] ? true : undefined}
      aria-describedby={errors[name] ? `${name}-error` : undefined}
      className={fieldClass(Boolean(errors[name]))}
    />
  );

  const shippingOptions = [
    {
      id: "standard" as const,
      title: "Made-to-Order Delivery",
      text: "Handcrafted & delivered in 5–7 business days with tracked courier.",
      price: cartTotal >= shippingRules.freeShippingThreshold ? "Free" : inr(shippingRules.flatFee),
    },
    {
      id: "express" as const,
      title: "Priority Atelier Dispatch (Jaipur Rush Craft)",
      text: "Priority needlework queue & air express dispatch within 3–5 business days.",
      price: inr(shippingRules.flatFee),
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <PageTitle
        title="Check Out"
        crumbs={[{ label: "Homepage", href: "/" }, { label: "Shopping Cart", href: "/cart" }, { label: "Check Out" }]}
      />

      <main className="max-w-[1320px] mx-auto px-4 lg:px-[15px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
          {/* LEFT: details form */}
          <div className="min-w-0 py-10 md:py-16 lg:py-20 lg:pr-[50px] xl:pr-[75px] lg:border-r border-line">
            {errors.general && (
              <div role="alert" className="mb-6 p-4 bg-error-bg border border-error-line text-error text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{errors.general}</span>
              </div>
            )}
            {isAdminAccount && (
              <div role="alert" className="mb-6 p-4 bg-warning-bg border border-warning-line text-warning text-sm rounded-lg">
                You are signed in with an administrator account. Administrator accounts cannot place orders. Sign out and use a
                customer account to shop.
              </div>
            )}

            {!user && (
              <p className="mb-8 md:mb-10 px-4 py-3 rounded-lg bg-surface-muted text-base text-ink-secondary">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-ink border-b border-ink hover:text-primary-hover hover:border-primary-hover"
                >
                  Login here
                </Link>
              </p>
            )}

            <form onSubmit={handlePlaceOrder} noValidate className="space-y-10 md:space-y-12">
              {/* Information */}
              <section aria-labelledby="co-info">
                <h2 id="co-info" className="text-2xl font-medium text-ink mb-5">
                  Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                    {field("firstName", { autoComplete: "given-name" })}
                    <FieldError id="firstName-error" message={errors.firstName} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                    {field("lastName", { autoComplete: "family-name" })}
                    <FieldError id="lastName-error" message={errors.lastName} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="email">Email Address</FieldLabel>
                    {field("email", { type: "email", placeholder: "you@email.com", autoComplete: "email" })}
                    <FieldError id="email-error" message={errors.email} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="phone">Mobile Phone</FieldLabel>
                    <div className="flex">
                      <span className="inline-flex items-center px-3.5 h-12 text-base text-ink-secondary bg-surface-muted border-2 border-r-0 border-line rounded-l-lg">
                        +91
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="9876543210"
                        autoComplete="tel-national"
                        inputMode="numeric"
                        aria-invalid={errors.phone ? true : undefined}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                        className={`${fieldClass(Boolean(errors.phone))} rounded-l-none`}
                      />
                    </div>
                    <FieldError id="phone-error" message={errors.phone} />
                  </div>
                </div>
                <label htmlFor="smsUpdates" className="mt-4 flex items-start gap-2.5 text-sm text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    id="smsUpdates"
                    name="smsUpdates"
                    checked={formData.smsUpdates}
                    onChange={handleInputChange}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  Send dispatch notifications and artisan atelier updates via WhatsApp &amp; SMS.
                </label>
              </section>

              {/* Address */}
              <section aria-labelledby="co-address">
                <h2 id="co-address" className="text-2xl font-medium text-ink mb-5">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="address">Street Address / House No.</FieldLabel>
                    {field("address", { placeholder: "House no., street", autoComplete: "address-line1" })}
                    <FieldError id="address-error" message={errors.address} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="apartment" optional>
                      Apartment / Suite / Landmark
                    </FieldLabel>
                    {field("apartment", { placeholder: "Apartment, suite, landmark (optional)", autoComplete: "address-line2" })}
                  </div>
                  <div>
                    <FieldLabel htmlFor="city">Town / City</FieldLabel>
                    {field("city", { autoComplete: "address-level2" })}
                    <FieldError id="city-error" message={errors.city} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="state">State</FieldLabel>
                    <div className="relative">
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      autoComplete="address-level1"
                      aria-invalid={errors.state ? true : undefined}
                      aria-describedby={errors.state ? "state-error" : undefined}
                      className={`${fieldClass(Boolean(errors.state))} appearance-none pr-10 font-medium`}
                    >
                      <option value="">Choose State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink" />
                    </div>
                    <FieldError id="state-error" message={errors.state} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="pincode">PIN Code</FieldLabel>
                    {field("pincode", { placeholder: "302001", autoComplete: "postal-code", maxLength: 6, inputMode: "numeric" })}
                    <FieldError id="pincode-error" message={errors.pincode} />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-ink mb-1.5">Country</span>
                    <p className="h-12 flex items-center px-4 rounded-lg bg-surface-muted text-base text-ink-secondary">India</p>
                  </div>
                </div>
                <label htmlFor="saveAddress" className="mt-4 flex items-center gap-2.5 text-sm text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    name="saveAddress"
                    checked={formData.saveAddress}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-primary"
                  />
                  Save this delivery address to my {BRAND.name} account.
                </label>
                <div className="mt-5">
                  <label htmlFor="bespokeNotes" className="block text-sm font-medium text-ink mb-1.5">
                    Bespoke sizing &amp; customization <span className="text-ink-muted font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="bespokeNotes"
                    name="bespokeNotes"
                    value={formData.bespokeNotes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="e.g. Please customize jacket length to 28 inches, or add festive gift message for packaging."
                    className="w-full bg-surface border-2 border-line rounded-lg px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
                  />
                  <p className="mt-1.5 text-sm text-ink-muted">
                    As all {BRAND.name} garments are handcrafted in Jaipur upon order, we provide complimentary sleeve,
                    shoulder, or length custom adjustments before needlework begins.
                  </p>
                </div>
              </section>

              {/* Delivery method */}
              <fieldset>
                <legend className="text-2xl font-medium text-ink mb-5">Delivery Method</legend>
                <div className="space-y-3">
                  {shippingOptions.map((opt) => {
                    const active = shippingMethod === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          active ? "border-ink bg-surface-muted" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={opt.id}
                          checked={active}
                          onChange={() => setShippingMethod(opt.id)}
                          className="mt-1 w-4 h-4 accent-primary shrink-0"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-base font-medium text-ink">{opt.title}</span>
                          <span className="block text-sm text-ink-secondary mt-0.5">{opt.text}</span>
                        </span>
                        <span className="text-base font-semibold text-ink shrink-0">{opt.price}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <PaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
                codEnabled={codEnabled}
                onlineEnabled={onlineEnabled}
                codFee={liveQuote ? liveQuote.codFee : 0}
                disabled={isSubmitting}
              />

              {/* Place order */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0 || isAdminAccount || promoChecking || quoting || noPaymentMethod}
                  className="w-full min-h-12 px-6 py-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-on-primary text-base font-semibold transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      {paymentMethod === "CASHFREE" ? "Taking you to secure payment..." : "Handcrafting Your Order..."}
                    </span>
                  ) : promoChecking ? (
                    <>Checking your promo code...</>
                  ) : quoting ? (
                    <>Updating your total...</>
                  ) : paymentMethod === "CASHFREE" ? (
                    <>Place Order · Pay {inr(finalTotal)} online</>
                  ) : (
                    <>Place Order · {inr(finalTotal)} on delivery</>
                  )}
                </button>
                <p className="text-center text-sm text-ink-muted mt-3">
                  By clicking Place Order, you confirm your bespoke garment request and agree to our{" "}
                  <Link href="/policies/terms" className="underline hover:text-primary-hover">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/policies/returns" className="underline hover:text-primary-hover">
                    Return Policy
                  </Link>
                  .
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT: order summary */}
          <aside
            aria-labelledby="co-summary"
            className="min-w-0 pt-10 pb-12 border-t border-line lg:border-t-0 lg:py-20 lg:pl-[50px] xl:pl-[75px] lg:sticky lg:top-20"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="co-summary" className="text-2xl font-medium text-ink">
                Order Summary
              </h2>
              <span className="text-sm text-ink-secondary">
                {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="py-8 text-base text-ink-secondary">
                Your bag is empty.{" "}
                <Link href="/collections" className="font-semibold text-ink underline">
                  Shop collections
                </Link>
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-line border-b border-line max-h-[420px] overflow-y-auto">
                {cart.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 flex gap-4 items-center">
                    <div className="relative w-[72px] aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-surface-muted">
                      <Image
                        src={item.product.images[0] || "/images/brand/saffronvastra-mark.png"}
                        alt={item.product.title}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-ink line-clamp-2">{item.product.title}</p>
                      <p className="text-sm text-ink-secondary mt-1">{[item.size, item.color?.name].filter(Boolean).join(" / ")}</p>
                    </div>
                    <p className="text-base text-ink shrink-0 whitespace-nowrap">
                      {item.quantity} X {inr(item.product.price)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* Voucher */}
            <form onSubmit={handleApplyPromo} className="mt-6 relative">
              <label htmlFor="checkout-promo" className="sr-only">
                Promo code
              </label>
              <input
                id="checkout-promo"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Add promo code"
                autoComplete="off"
                className="w-full h-[54px] pl-4 pr-32 bg-surface border-2 border-line rounded-lg text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
              />
              <button
                type="submit"
                disabled={promoBusy || promoChecking}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-[38px] px-4 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary text-sm font-semibold transition-colors"
              >
                Apply Code
              </button>
            </form>
            {promoMessage && (
              <p
                role={promoMessage.isError ? "alert" : "status"}
                className={`mt-2 text-sm flex items-center gap-1.5 ${promoMessage.isError ? "text-error" : "text-success font-medium"}`}
              >
                {promoMessage.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                {promoMessage.text}
              </p>
            )}
            {appliedPromo && (
              <div className="mt-3 inline-flex items-center gap-2 pl-3 pr-1 py-1 bg-success-bg border border-success-line text-success text-sm rounded-lg">
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>
                  <strong>{appliedPromo.code}</strong> ({appliedPromo.description})
                </span>
                <button
                  type="button"
                  onClick={removePromo}
                  aria-label="Remove promo code"
                  className="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-error transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <dl className="mt-6 pt-2 border-t border-line text-base">
              <div className="flex justify-between items-center py-2.5">
                <dt className="font-semibold text-ink">Subtotal</dt>
                <dd className="text-ink">{inr(cartTotal)}</dd>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <dt className="font-semibold text-ink">Shipping</dt>
                <dd className="text-ink">{shippingCost === 0 ? "Free" : inr(shippingCost)}</dd>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between items-center py-2.5">
                  <dt className="font-semibold text-ink">Cash on Delivery fee</dt>
                  <dd className="text-ink">{inr(codFee)}</dd>
                </div>
              )}
              {appliedPromo && (
                <div className="flex justify-between items-center py-2.5">
                  <dt className="font-semibold text-ink">Discount ({appliedPromo.code})</dt>
                  <dd className="text-success font-semibold">-{inr(effectivePromoDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-5 mt-2.5 border-t border-line">
                <dt className="text-2xl font-medium text-ink">Total</dt>
                <dd className="text-2xl font-medium text-ink">{inr(finalTotal)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-sm text-ink-muted">Prices in INR, taxes included.</p>

            <Link
              href="/cart"
              className="mt-6 inline-flex items-center gap-1.5 min-h-11 text-base font-semibold text-ink hover:text-primary-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Return to Shopping Cart
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
