"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Offcanvas from "@/components/ui/Offcanvas";
import QtyStepper from "@/components/cart/QtyStepper";
import PriceTag from "@/components/ui/PriceTag";
import { useFeaturedProducts } from "@/components/layout/useCatalogNav";
import { X, Truck } from "lucide-react";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Modave mini cart: right off-canvas with a "You May Also Like" column (lg+), the free-shipping meter,
// line items and a sticky subtotal + View cart / Checkout footer.
export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, updateQuantity, cartTotal, cartCount, freeShippingThreshold } = useStore();

  const closeRef = useRef<HTMLButtonElement>(null);
  const featured = useFeaturedProducts(isCartOpen, 6);
  const inCart = new Set(cart.map((i) => i.product.id));
  const recs = featured.filter((p) => !inCart.has(p.id)).slice(0, 4);
  const showRecs = recs.length > 0;

  const threshold = freeShippingThreshold > 0 ? freeShippingThreshold : 0;
  const pct = threshold ? Math.min(100, Math.round((cartTotal / threshold) * 100)) : 0;
  const remaining = Math.max(0, threshold - cartTotal);

  return (
    <Offcanvas
      open={isCartOpen}
      onClose={closeCart}
      label="Shopping Cart"
      side="right"
      initialFocusRef={closeRef}
      panelClassName={`w-[90vw] max-w-[480px] ${showRecs ? "lg:w-[708px] lg:max-w-[708px]" : ""} flex-row shadow-drawer`}
    >
      {/* Recommendations column (lg+) */}
      {showRecs && (
        <aside aria-label="You may also like" className="hidden lg:flex w-[228px] shrink-0 flex-col border-r border-line">
          <h2 className="px-6 pt-6 pb-3 text-xl font-medium text-ink">You May Also Like</h2>
          <ul className="flex-1 overflow-y-auto px-6 pb-6">
            {recs.map((p) => (
              <li key={p.id} className="py-4 border-b border-line last:border-b-0 first:pt-1">
                <Link href={`/products/${p.slug}`} onClick={closeCart} className="group block">
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-surface-muted">
                    {p.images[0] && (
                      <Image src={p.images[0]} alt={p.title} fill sizes="180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </span>
                  <span className="mt-3 text-base text-ink line-clamp-1 group-hover:text-primary-hover transition-colors">{p.title}</span>
                </Link>
                <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} comparePosition="before" showDiscount={false} size="md" className="mt-1" />
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Cart column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-6 pb-3">
          <h2 className="text-xl font-medium text-ink">
            Shopping Cart <span className="text-base text-ink-muted">({cartCount})</span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            className="w-11 h-11 shrink-0 rounded-full bg-surface-muted text-ink inline-flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6">
          {/* Free shipping meter: only when the store has a threshold */}
          {threshold > 0 && (
            <div className="mt-3 rounded-xl bg-surface-muted p-4">
              <div
                role="progressbar"
                aria-label="Progress towards free shipping"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="relative mx-4 my-3 h-1 rounded-full bg-canvas"
              >
                <div className="absolute inset-y-0 left-0 rounded-full bg-success transition-[width] duration-500" style={{ width: `${pct}%` }} />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-success bg-canvas text-ink inline-flex items-center justify-center transition-[left] duration-500"
                  style={{ left: `${pct}%` }}
                >
                  <Truck className="w-4 h-4" />
                </span>
              </div>
              <p className="mt-4 text-sm text-ink">
                {remaining > 0 ? (
                  <>
                    Buy <span className="font-semibold text-secondary">{inr(remaining)}</span> more to get <strong className="font-semibold">free shipping</strong>
                  </>
                ) : (
                  <>Congratulations! You&rsquo;ve got free shipping!</>
                )}
              </p>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-6 text-base text-ink leading-relaxed">
              Your cart is empty. Start adding favourite pieces to your cart!{" "}
              <Link
                href="/collections"
                onClick={closeCart}
                className="inline-block font-semibold text-ink border-b-2 border-ink leading-6 hover:text-primary-hover hover:border-primary-hover transition-colors"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <ul>
              {cart.map((item) => (
                <li key={item.id} className="flex gap-4 sm:gap-6 py-5 border-b border-line last:border-b-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={closeCart}
                    className="relative block w-[84px] sm:w-[90px] aspect-[3/4] shrink-0 overflow-hidden rounded bg-surface-muted"
                  >
                    <Image
                      src={item.product.images[0] || "/images/products/maroon_jacket.jpg"}
                      alt={item.product.title}
                      fill
                      sizes="90px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={closeCart}
                        className="min-w-0 text-base font-medium text-ink line-clamp-2 hover:text-primary-hover transition-colors"
                      >
                        {item.product.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="-mt-2.5 -mr-1 min-h-11 px-1 shrink-0 text-sm font-semibold text-secondary underline underline-offset-2 hover:text-primary-hover transition-colors"
                        aria-label="Remove item"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                      <span className="text-ink-secondary">
                        {item.size}
                        {item.color?.name && <> / {item.color.name}</>}
                      </span>
                      <span className="font-semibold text-ink">
                        {item.quantity} &times; {inr(item.product.price)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <QtyStepper
                        size="sm"
                        quantity={item.quantity}
                        label={item.product.title}
                        onDecrease={() => updateQuantity(item.id, -1)}
                        onIncrease={() => updateQuantity(item.id, 1)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Recommendations below lg: a horizontal row under the items */}
          {showRecs && (
            <section aria-label="You may also like" className="lg:hidden mt-2 mb-6 pt-5 border-t border-line">
              <h3 className="text-lg font-medium text-ink">You May Also Like</h3>
              <ul className="mt-3 flex gap-4 overflow-x-auto snap-x pb-1">
                {recs.map((p) => (
                  <li key={p.id} className="w-[132px] shrink-0 snap-start">
                    <Link href={`/products/${p.slug}`} onClick={closeCart} className="group block">
                      <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-surface-muted">
                        {p.images[0] && <Image src={p.images[0]} alt={p.title} fill sizes="132px" className="object-cover" />}
                      </span>
                      <span className="mt-2 text-sm text-ink line-clamp-1 group-hover:text-primary-hover transition-colors">{p.title}</span>
                    </Link>
                    <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} comparePosition="before" showDiscount={false} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-line px-4 sm:px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xl font-medium text-ink">Subtotal</span>
              <span className="text-2xl font-medium text-ink">{inr(cartTotal)}</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted">Taxes calculated at checkout. Made-to-order delivery timeline: 5–7 days.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
              <Link
                href="/cart"
                onClick={closeCart}
                className="inline-flex h-12 sm:h-14 items-center justify-center rounded border border-ink bg-canvas text-base font-semibold text-ink hover:bg-primary hover:text-on-primary transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="inline-flex h-12 sm:h-14 items-center justify-center rounded border border-primary bg-primary text-base font-semibold text-on-primary hover:bg-primary-hover hover:border-primary-hover transition-colors"
              >
                Checkout
              </Link>
            </div>
            <div className="mt-3 text-center">
              <Link
                href="/collections"
                onClick={closeCart}
                className="inline-flex min-h-11 items-center text-sm font-semibold uppercase tracking-[0.08em] text-ink hover:text-primary-hover transition-colors"
              >
                Or continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </Offcanvas>
  );
}
