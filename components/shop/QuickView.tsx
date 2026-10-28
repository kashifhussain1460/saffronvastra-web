"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Heart, X, Check, Loader2 } from "lucide-react";
import { Product, Size, ProductColor } from "@/types";
import { useStore } from "@/context/StoreContext";
import PriceTag from "@/components/ui/PriceTag";
import QtyStepper from "@/components/cart/QtyStepper";
import { useDialog } from "./hooks";

interface Variant {
  id: string;
  size: string;
  colourName: string | null;
  colourHex: string | null;
}

/**
 * Quick view / quick add. The product's live variants are loaded first, and "Add to cart" stays
 * disabled until the chosen colour + size is a variant that really exists, so nothing is ever added
 * without a valid variant. Adding goes through the StoreContext cart like the product page does.
 */
export default function QuickView({
  product,
  open,
  onClose,
  mode = "view",
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  mode?: "view" | "add";
}) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const [mounted, setMounted] = useState(false);
  const panelRef = useDialog(open && mounted, onClose);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [colour, setColour] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState("loading");
    setQty(1);
    setImageIdx(0);
    fetch(`/api/v1/products/${encodeURIComponent(product.slug)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("product"))))
      .then((body) => {
        if (cancelled) return;
        const vs: Variant[] = (body?.data?.variants || []).filter((v: any) => v && v.id && v.size && (!v.status || v.status === "Active"));
        setVariants(vs);
        const colours = Array.from(new Set(vs.map((v) => v.colourName || "")));
        setColour(colours.length === 1 ? colours[0] : null);
        const sizes = Array.from(new Set(vs.map((v) => v.size)));
        setSize(sizes.length === 1 ? sizes[0] : null);
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [open, product.slug]);

  const colours = useMemo(() => {
    const m = new Map<string, string>();
    variants.forEach((v) => !m.has(v.colourName || "") && m.set(v.colourName || "", v.colourHex || ""));
    return Array.from(m, ([name, hex]) => ({ name, hex }));
  }, [variants]);
  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  const sizeAvailable = (s: string) => variants.some((v) => v.size === s && (colour === null || (v.colourName || "") === colour));
  const chosen = variants.find((v) => v.size === size && (v.colourName || "") === (colour ?? "")) || null;
  const needsColour = colours.length > 1 && colour === null;
  const needsSize = size === null || (size !== null && !sizeAvailable(size));

  if (!open || !mounted) return null;

  const images = product.images.length ? product.images : ["/images/brand/saffronvastra-mark.png"];
  const isFav = isInWishlist(product.id);
  const titleId = `qv-title-${product.id}`;

  const handleAdd = () => {
    if (!chosen) return;
    const colourObj: ProductColor =
      product.colors.find((c) => c.name === chosen.colourName) || { name: chosen.colourName || "Standard", hex: chosen.colourHex || "" };
    addToCart(product, chosen.size as Size, colourObj, qty);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-canvas shadow-luxury outline-none sm:rounded-xl ${
          mode === "add" ? "sm:max-w-[520px]" : "sm:max-w-[920px] md:flex-row"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-surface text-ink transition-colors hover:text-primary-hover"
        >
          <X className="h-5 w-5" />
        </button>

        {mode === "view" ? (
          <div className="relative hidden w-[46%] shrink-0 bg-surface-muted md:block">
            <div className="relative aspect-[3/4] w-full">
              <Image src={images[imageIdx]} alt={product.title} fill sizes="420px" className="object-cover" />
            </div>
            {images.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                {images.slice(0, 6).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIdx(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === imageIdx}
                    className={`h-2.5 w-2.5 rounded-full border border-ink transition-colors ${i === imageIdx ? "bg-ink" : "bg-surface"}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 pt-6 sm:p-8">
          <div className="flex gap-4 pr-10">
            {/* thumbnail: always in quick add, only on small screens in quick view (desktop shows the big photo) */}
            <div className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted ${mode === "view" ? "md:hidden" : ""}`}>
              <Image src={images[0]} alt="" fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-medium leading-snug text-ink sm:text-2xl">
                {product.title}
              </h2>
              <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} comparePosition="before" size="md" className="mt-2" />
              <p className="mt-1 text-sm text-ink-muted">
                {product.availabilityMode} &middot; ships in {product.leadTime}
              </p>
            </div>
          </div>

          {mode === "view" && product.description && (
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-secondary">{product.description}</p>
          )}

          <div className="mt-5 border-t border-line pt-5">
            {state === "loading" && (
              <p role="status" className="flex items-center gap-2 text-sm text-ink-secondary">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading sizes and colours...
              </p>
            )}
            {state === "error" && (
              <p role="alert" className="text-sm text-error">
                We could not load the sizes for this piece. Please open the product page.
              </p>
            )}
            {state === "ready" && variants.length === 0 && (
              <p role="status" className="text-sm text-ink-secondary">This piece has no sizes available to order right now.</p>
            )}
            {state === "ready" && variants.length > 0 && (
              <div className="space-y-5">
                {colours.length > 0 && colours.some((c) => c.name) && (
                  <fieldset>
                    <legend className="mb-2 text-sm text-ink">
                      Colour: <span className="font-semibold">{colour || "Select"}</span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {colours.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setColour(c.name)}
                          aria-pressed={colour === c.name}
                          aria-label={`Colour ${c.name || "Standard"}`}
                          className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3 text-sm transition-colors md:min-h-[38px] ${
                            colour === c.name ? "border-ink text-ink" : "border-line text-ink-secondary hover:border-ink"
                          }`}
                        >
                          {c.hex && <span className="h-5 w-5 rounded-full border border-line" style={{ backgroundColor: c.hex }} />}
                          {c.name || "Standard"}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                <fieldset>
                  <legend className="mb-2 text-sm text-ink">
                    Size: <span className="font-semibold">{size || "Select"}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => {
                      const ok = sizeAvailable(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={!ok}
                          onClick={() => setSize(s)}
                          aria-pressed={size === s}
                          aria-label={`Size ${s}${ok ? "" : " (not available in this colour)"}`}
                          className={`grid h-11 min-w-11 place-items-center rounded-full border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted disabled:line-through ${
                            size === s && ok ? "border-ink bg-primary text-on-primary" : "border-line text-ink hover:border-ink"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QtyStepper
              quantity={qty}
              label={product.title}
              onDecrease={() => setQty((q) => Math.max(1, q - 1))}
              onIncrease={() => setQty((q) => Math.min(10, q + 1))}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!chosen || state !== "ready"}
              className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-muted md:h-[46px]"
            >
              {chosen ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" /> Add to cart
                </>
              ) : needsColour ? (
                "Select a colour"
              ) : needsSize ? (
                "Select a size"
              ) : (
                "Add to cart"
              )}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={isFav}
              aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink md:h-[46px] md:w-[46px]"
            >
              <Heart className={`h-[18px] w-[18px] ${isFav ? "fill-secondary text-secondary" : ""}`} />
            </button>
          </div>

          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="mt-5 inline-block self-start text-sm font-medium text-ink underline underline-offset-4 hover:text-primary-hover"
          >
            View full details
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
