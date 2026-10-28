"use client";

import { BRAND } from "@/lib/brand";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import type { Product } from "@/types";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import PriceTag from "@/components/ui/PriceTag";
import PageTitle from "@/components/checkout/PageTitle";
import QtyStepper from "@/components/cart/QtyStepper";
import FreeShippingProgress from "@/components/cart/FreeShippingProgress";
import { ShoppingBag, ArrowRight, ArrowUpRight, XCircle, X, Heart, Check, AlertCircle } from "lucide-react";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function CartPage() {
  const {
    cart,
    cartTotal,
    cartCount,
    removeFromCart,
    updateQuantity,
    appliedPromo,
    promoDiscount,
    applyPromo,
    removePromo,
    freeShippingThreshold,
    shippingFee,
    finalTotal,
    addToCart,
    isInWishlist,
    toggleWishlist,
  } = useStore();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [addedCrossSellId, setAddedCrossSellId] = useState<string | null>(null);

  // "Complete your look" suggests published products from the live catalogue that are not already in the cart.
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/products?limit=16&sort=featured")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !Array.isArray(body?.items)) return;
        setCatalogue(body.items.map(mapBackendProductToFrontend));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const crossSellProducts = catalogue
    .filter((p) => !cart.some((line) => line.product.slug === p.slug))
    .slice(0, 4);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim() || promoBusy) return;
    setPromoBusy(true);
    const res = await applyPromo(promoInput);
    setPromoBusy(false);
    setPromoMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setPromoInput("");
    }
  };

  const handleAddCrossSell = (product: Product) => {
    addToCart(product, product.sizes?.[0] || "M", product.colors?.[0]);
    setAddedCrossSellId(product.id);
    setTimeout(() => setAddedCrossSellId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageTitle
        title="Shopping Cart"
        crumbs={[{ label: "Homepage", href: "/" }, { label: "Shop", href: "/collections" }, { label: "Shopping Cart" }]}
      />

      <section
        className={`max-w-[1320px] mx-auto px-4 lg:px-[15px] py-10 md:py-16 lg:py-20 ${
          cart.length > 0 ? "pb-[calc(var(--bottom-nav-h,0px)+6rem)] md:pb-16 lg:pb-20" : ""
        }`}
      >
        {cart.length === 0 ? (
          /* Empty cart */
          <div className="max-w-md mx-auto text-center py-6 md:py-10">
            <div className="w-24 h-24 mx-auto rounded-full bg-surface-muted grid place-items-center mb-6">
              <ShoppingBag className="w-10 h-10 text-ink stroke-[1.25]" aria-hidden="true" />
            </div>
            <h2 className="text-2xl md:text-[28px] font-medium text-ink mb-2">Your Cart is Empty</h2>
            <p className="text-base text-ink-secondary mb-8 leading-relaxed">
              Every garment at {BRAND.name} is handcrafted with devotion. Explore our collections to find made-to-order
              embroidery tailored just for you.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors"
            >
              Explore Collections <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-10 xl:gap-[60px] items-start">
            {/* LEFT: progress, items, voucher */}
            <div className="min-w-0">
              <FreeShippingProgress cartTotal={cartTotal} threshold={freeShippingThreshold} />

              {/* Items */}
              <div className="mt-6 md:mt-8">
                {/* Table head (md+) */}
                <div
                  aria-hidden="true"
                  className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_150px_120px_28px] gap-4 pb-3 border-b border-line text-xl font-medium text-ink"
                >
                  <span>Products</span>
                  <span className="text-center">Price</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-center">Total Price</span>
                  <span />
                </div>

                <ul className="divide-y divide-line border-b border-line">
                  {cart.map((item) => {
                    const itemTotal = item.product.price * item.quantity;
                    const variant = [item.size && `Size: ${item.size}`, item.color?.name && item.color.name]
                      .filter(Boolean)
                      .join(" / ");
                    return (
                      <li
                        key={item.id}
                        className="py-5 md:py-7 grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 md:grid-cols-[minmax(0,1fr)_100px_150px_120px_28px] md:gap-4 md:items-center"
                      >
                        {/* Product cell */}
                        <div className="contents md:flex md:items-center md:gap-5 md:min-w-0">
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="relative row-span-5 self-start block w-24 md:w-20 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-surface-muted"
                          >
                            <Image
                              src={item.product.images[0] || "/images/brand/saffronvastra-mark.png"}
                              alt={item.product.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="text-base text-ink hover:text-primary-hover transition-colors line-clamp-2"
                            >
                              {item.product.title}
                            </Link>
                            {variant && (
                              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-secondary">
                                {item.color?.hex && item.color?.name && (
                                  <span
                                    aria-hidden="true"
                                    className="inline-block w-3 h-3 rounded-full border border-line"
                                    style={{ backgroundColor: item.color.hex }}
                                  />
                                )}
                                {variant}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-start-2 md:col-start-auto mt-3 md:mt-0 flex items-center justify-between md:justify-center text-base text-ink">
                          <span className="md:hidden text-ink-secondary">Price</span>
                          <PriceTag price={item.product.price} className="md:justify-center" showDiscount={false} />
                        </div>

                        {/* Quantity */}
                        <div className="col-start-2 md:col-start-auto mt-2 md:mt-0 flex items-center justify-between md:justify-center">
                          <span className="md:hidden text-base text-ink-secondary">Quantity</span>
                          <QtyStepper
                            quantity={item.quantity}
                            label={item.product.title}
                            onDecrease={() => updateQuantity(item.id, -1)}
                            onIncrease={() => updateQuantity(item.id, 1)}
                          />
                        </div>

                        {/* Total */}
                        <div className="col-start-2 md:col-start-auto mt-2 md:mt-0 flex items-center justify-between md:justify-center text-base font-semibold text-ink">
                          <span className="md:hidden font-normal text-ink-secondary">Total</span>
                          <span>{inr(itemTotal)}</span>
                        </div>

                        {/* Remove */}
                        <div className="col-start-2 md:col-start-auto mt-1 md:mt-0 flex md:justify-end">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.product.title} from cart`}
                            title="Remove item"
                            className="w-full md:w-auto min-h-11 md:min-h-0 flex items-center justify-between md:justify-center gap-2 text-base text-ink-secondary md:text-secondary hover:text-primary-hover transition-colors"
                          >
                            <span className="md:hidden">Remove</span>
                            <XCircle className="w-5 h-5 text-secondary stroke-[1.5]" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Voucher */}
              <form onSubmit={handleApplyPromo} className="mt-6 md:mt-7 relative">
                <label htmlFor="cart-promo" className="sr-only">
                  Promo code
                </label>
                <input
                  id="cart-promo"
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter promo code"
                  autoComplete="off"
                  className="w-full h-[54px] pl-4 pr-28 bg-surface border-2 border-line rounded-lg text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
                />
                <button
                  type="submit"
                  disabled={promoBusy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-[38px] min-w-[88px] px-4 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary text-sm font-semibold transition-colors"
                >
                  Apply
                </button>
              </form>

              {promoMessage && (
                <p
                  role={promoMessage.isError ? "alert" : "status"}
                  className={`mt-2.5 text-sm flex items-center gap-1.5 ${
                    promoMessage.isError ? "text-error" : "text-success font-medium"
                  }`}
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
                    <strong>{appliedPromo.code}</strong> applied ({appliedPromo.description})
                  </span>
                  <button
                    type="button"
                    onClick={removePromo}
                    aria-label="Remove promo code"
                    title="Remove promo code"
                    className="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-error transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mt-6 hidden md:block">
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-2 text-base font-semibold text-ink border-b border-ink hover:text-primary-hover hover:border-primary-hover transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* RIGHT: Order summary */}
            <aside aria-labelledby="cart-summary-title" className="lg:sticky lg:top-28">
              <div className="bg-surface-muted rounded-xl p-5 md:p-6">
                <h2 id="cart-summary-title" className="text-2xl font-medium text-ink">
                  Order Summary
                </h2>

                <dl className="mt-4 text-base">
                  <div className="flex justify-between items-center py-4 border-b border-line">
                    <dt className="font-semibold text-ink">Subtotal ({cartCount} items)</dt>
                    <dd className="font-semibold text-ink">{inr(cartTotal)}</dd>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-line">
                    <dt className="font-semibold text-ink">
                      Discounts{appliedPromo ? <span className="font-normal text-ink-secondary"> ({appliedPromo.code})</span> : null}
                    </dt>
                    <dd className={appliedPromo ? "font-semibold text-success" : "text-ink"}>
                      {appliedPromo ? `-${inr(promoDiscount)}` : inr(0)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-line">
                    <dt className="font-semibold text-ink">Shipping</dt>
                    <dd className="text-ink">{shippingFee === 0 ? "Free" : inr(shippingFee)}</dd>
                  </div>
                  <div className="flex justify-between items-baseline pt-5">
                    <dt className="text-2xl font-medium text-ink">Total</dt>
                    <dd className="text-2xl font-medium text-ink">{inr(finalTotal)}</dd>
                  </div>
                </dl>
                <p className="mt-1 text-sm text-ink-muted">Prices in INR, taxes included.</p>

                <div className="hidden md:block mt-5">
                  <Link
                    href="/checkout"
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold transition-colors"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    href="/collections"
                    className="mt-3 flex justify-center text-base font-semibold text-ink hover:text-primary-hover transition-colors"
                  >
                    Or continue shopping
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Sticky bottom bar (below md, populated bag only) */}
      {cart.length > 0 && (
        <div className="md:hidden fixed inset-x-0 bottom-[var(--bottom-nav-h,0px)] z-40 bg-surface border-t border-line px-4 py-2.5 shadow-drawer flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-xs text-ink-secondary">Total</p>
            <p className="text-base font-semibold text-ink">{inr(finalTotal)}</p>
          </div>
          <Link
            href="/checkout"
            className="h-12 flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-base font-semibold"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Complete your look: live, published products not already in the bag */}
      {crossSellProducts.length > 0 && (
        <section className="border-t border-line py-12 md:py-20">
          <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px]">
            <h2 className="text-center text-[28px] md:text-[40px] leading-tight font-medium text-ink mb-8 md:mb-12">
              Complete Your Look
            </h2>

            <ul className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:gap-[30px] md:overflow-visible">
              {crossSellProducts.map((item) => {
                const inWish = isInWishlist(item.id);
                const isAdded = addedCrossSellId === item.id;
                return (
                  <li key={item.id} className="w-[62%] max-w-[240px] shrink-0 snap-start md:w-auto md:max-w-none group">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-muted">
                      <Link href={`/products/${item.slug}`} aria-label={`View ${item.title}`} className="absolute inset-0">
                        <Image
                          src={item.images[0] || "/images/brand/saffronvastra-mark.png"}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 62vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.id)}
                        aria-label={`Save ${item.title} to wishlist`}
                        aria-pressed={inWish}
                        className="absolute top-3 right-3 w-11 h-11 md:w-10 md:h-10 grid place-items-center rounded-full bg-surface text-ink hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${inWish ? "fill-current" : ""}`} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCrossSell(item)}
                        aria-label={`Add ${item.title} to bag`}
                        className={`absolute left-3 right-3 bottom-3 h-11 md:h-10 rounded-full text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:focus-visible:opacity-100 md:focus-visible:translate-y-0 ${
                          isAdded
                            ? "bg-success text-on-primary md:opacity-100 md:translate-y-0"
                            : "bg-surface text-ink hover:bg-primary hover:text-on-primary"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" aria-hidden="true" /> Added
                          </>
                        ) : (
                          "Add to Cart"
                        )}
                      </button>
                    </div>
                    <h3 className="mt-3 md:mt-4 text-base text-ink truncate">
                      <Link href={`/products/${item.slug}`} className="hover:text-primary-hover transition-colors">
                        {item.title}
                      </Link>
                    </h3>
                    <PriceTag price={item.price} compareAtPrice={item.compareAtPrice} className="mt-1" />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

    </div>
  );
}
