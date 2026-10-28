"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product, Size, ProductColor } from "@/types";
import { useStore } from "@/context/StoreContext";
import { analytics } from "@/lib/analytics";
import PriceTag from "@/components/ui/PriceTag";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import ProductGallery from "@/components/product/ProductGallery";
import VariantSelector, { PdpVariant, sizeAvailable, colorAvailable } from "@/components/product/VariantSelector";
import QuantitySelector from "@/components/product/QuantitySelector";
import ProductTabs, { PdpTab, SpecRow } from "@/components/product/ProductTabs";
import StickyAddToCart from "@/components/product/StickyAddToCart";
import ProductRecommendations from "@/components/product/ProductRecommendations";
import { Star, Heart, Check, ChevronRight, Truck, RotateCcw, Timer, MessageCircleQuestion, Share2 } from "lucide-react";

/** Stored fields the mapped Product does not carry; all of them come straight from the API. */
export interface ProductExtras {
  variants: PdpVariant[];
  imageAlts: string[];
  material?: string | null;
  embroidery?: string | null;
  careInstructions?: string | null;
  leadTimeDays?: number | null;
  brand?: string | null;
  productType?: string | null;
  categoryName?: string | null;
  collectionName?: string | null;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  extras?: ProductExtras;
}

// The cart API accepts at most 50 garments per line.
const MAX_QTY = 50;

export default function ProductDetailClient({ product, relatedProducts, extras }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, closeCart } = useStore();
  const variants = useMemo(() => extras?.variants ?? [], [extras]);

  // The gallery shows this product's own photographs only.
  const galleryImages = product.images.length > 0 ? product.images : ["/images/brand/saffronvastra-mark.png"];

  const firstAvailableColor = product.colors.length === 1 && colorAvailable(variants, product.colors[0].name) ? product.colors[0] : null;
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(firstAvailableColor);
  const [selectedSize, setSelectedSize] = useState<Size | null>(
    product.sizes.length === 1 && sizeAvailable(variants, product.sizes[0], firstAvailableColor?.name) ? product.sizes[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<PdpTab>("description");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [sizeError, setSizeError] = useState("");
  const [colorError, setColorError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const closeSizeGuide = useCallback(() => setIsSizeGuideOpen(false), []);

  const sizeGroupRef = useRef<HTMLDivElement>(null);
  const colorGroupRef = useRef<HTMLDivElement>(null);
  const ctaRowRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (product) {
      analytics.trackProductView(product.id, product.title, product.slug, product.price * 100);
    }
  }, [product]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const isFavorited = isInWishlist(product.id);
  const unavailable = product.availabilityMode === "Unavailable";
  const hasCompare = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasCompare ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;

  const selectedVariant = useMemo(
    () =>
      selectedSize
        ? variants.find((v) => v.size === selectedSize && (!selectedColor || (v.colourName || "Standard") === selectedColor.name))
        : undefined,
    [variants, selectedSize, selectedColor]
  );

  const handleColorChange = (c: ProductColor) => {
    setSelectedColor(c);
    setColorError("");
    if (selectedSize && !sizeAvailable(variants, selectedSize, c.name)) setSelectedSize(null);
  };
  const handleSizeChange = (s: Size) => {
    setSelectedSize(s);
    setSizeError("");
  };

  /** Checks the required options; on failure shows the message and moves the user to the option. */
  const validate = (): { size: Size; color: ProductColor } | null => {
    const missingColor = !selectedColor;
    const missingSize = !selectedSize;
    setColorError(missingColor ? "Please select a colour." : "");
    setSizeError(missingSize ? "Please select a size." : "");
    if (missingColor || missingSize) {
      const target = missingColor ? colorGroupRef.current : sizeGroupRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
      return null;
    }
    return { size: selectedSize!, color: selectedColor! };
  };

  const handleAddToCart = () => {
    if (unavailable) return;
    const picked = validate();
    if (!picked) return;
    addToCart(product, picked.size, picked.color, quantity);
    setAddedToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    if (unavailable) return;
    const picked = validate();
    if (!picked) return;
    addToCart(product, picked.size, picked.color, quantity);
    closeCart();
    router.push("/checkout");
  };

  const openTab = (t: PdpTab) => {
    setActiveTab(t);
    requestAnimationFrame(() => document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setShareStatus("Could not share this link");
    }
    setTimeout(() => setShareStatus(""), 2500);
  };

  // ---- real stored fields for the tabs -------------------------------------------------
  const careLines = (extras?.careInstructions || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const materialLines = [
    extras?.material ? `Material: ${extras.material}` : "",
    extras?.embroidery ? `Embroidery: ${extras.embroidery}` : "",
  ].filter(Boolean);
  const leadTimeText = extras?.leadTimeDays ? `${extras.leadTimeDays} business days` : product.leadTime;
  const specs: SpecRow[] = [
    ...(extras?.material ? [{ label: "Material", value: extras.material }] : []),
    ...(extras?.embroidery ? [{ label: "Embroidery", value: extras.embroidery }] : []),
    { label: product.colors.length > 1 ? "Colours" : "Colour", value: product.colors.map((c) => c.name).join(", ") },
    { label: "Sizes", value: product.sizes.join(", ") },
    { label: "Availability", value: product.availabilityMode },
    { label: "Production lead time", value: leadTimeText },
    ...(extras?.productType ? [{ label: "Product type", value: extras.productType }] : []),
    ...(extras?.brand ? [{ label: "Brand", value: extras.brand }] : []),
    ...(extras?.categoryName ? [{ label: "Category", value: extras.categoryName }] : []),
  ];

  const categoryLabel = extras?.categoryName || product.category.replace(/-/g, " ");
  // eyebrow: the stored collection, else the category (never the mapper's placeholder collection)
  const eyebrow = extras ? extras.collectionName || extras.categoryName || "" : categoryLabel;
  const stickySummary = [selectedColor?.name, selectedSize].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-canvas">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1320px] px-4 pt-4 pb-5 sm:pt-5 lg:px-[15px] lg:pb-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm text-ink">
            <li className="shrink-0">
              <Link href="/" className="transition-colors hover:text-primary-hover">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="shrink-0">
              <Link href={`/collections?category=${product.category}`} className="capitalize transition-colors hover:text-primary-hover">
                {categoryLabel}
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="min-w-0 truncate underline underline-offset-2" aria-current="page">
              {product.title}
            </li>
          </ol>
        </nav>
      </div>

      {/* Gallery + buy box */}
      <section className="mx-auto max-w-[1320px] px-4 lg:px-[15px]">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-[30px] xl:gap-[45px]">
          <div className="md:sticky md:top-24">
            <ProductGallery
              images={galleryImages}
              alts={extras?.imageAlts}
              title={product.title}
              badge={product.badges?.[0]}
              discountLabel={discount > 0 ? `-${discount}%` : undefined}
            />
          </div>

          <div className="min-w-0">
            {/* Heading */}
            <div className="space-y-3 border-b border-line pb-5">
              {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted">{eyebrow}</p>}
              <h1 className="text-[26px] font-medium leading-tight text-ink sm:text-[32px] md:text-[28px] xl:text-[36px] xl:leading-[46px]">
                {product.title}
              </h1>

              {/* Rating: real approved reviews only; nothing is shown for a product without any */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2" data-testid="pdp-rating">
                  <span className="flex items-center" role="img" aria-label={`Rated ${product.rating.toFixed(1)} out of 5`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-highlight text-highlight" : "text-line-strong"}`}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-medium text-ink">{product.rating.toFixed(1)}</span>
                  <button
                    type="button"
                    onClick={() => openTab("reviews")}
                    className="text-sm text-ink-secondary underline-offset-2 hover:text-primary-hover hover:underline"
                  >
                    ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <PriceTag
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  size="lg"
                  showDiscount={false}
                  className="text-2xl"
                />
                {discount > 0 && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-on-primary">-{discount}%</span>
                )}
              </div>

              {(product.subtitle || product.description) && (
                <p className="line-clamp-4 text-base leading-relaxed text-ink-secondary">{product.subtitle || product.description}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-5 pt-5">
              <VariantSelector
                colors={product.colors}
                sizes={product.sizes}
                variants={variants}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                onColorChange={handleColorChange}
                onSizeChange={handleSizeChange}
                onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
                sizeError={sizeError}
                colorError={colorError}
                sizeGroupRef={sizeGroupRef}
                colorGroupRef={colorGroupRef}
              />

              <div className="space-y-2.5">
                <label htmlFor="pdp-quantity" className="block text-base text-ink">
                  Quantity:
                </label>
                <QuantitySelector value={quantity} onChange={setQuantity} max={MAX_QTY} disabled={unavailable} />
              </div>

              {/* Add to cart + wishlist, Buy now */}
              <div ref={ctaRowRef} className="space-y-3 pt-1">
                <div className="flex items-stretch gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={unavailable}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unavailable ? (
                      "Currently unavailable"
                    ) : addedToast ? (
                      <>
                        <Check className="h-4 w-4" /> Added to Cart
                      </>
                    ) : (
                      <>
                        Add to Cart <span aria-hidden="true">-</span> ₹{(product.price * quantity).toLocaleString("en-IN")}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={isFavorited}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isFavorited ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-ink hover:border-primary hover:bg-primary hover:text-on-primary"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </button>
                </div>
                {!unavailable && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="h-12 w-full rounded-full bg-primary-hover px-6 text-xs font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary"
                  >
                    Buy it now
                  </button>
                )}
                <p className="sr-only" role="status" aria-live="polite">
                  {addedToast ? `${product.title} is now in your cart` : ""}
                </p>
              </div>
            </div>

            {/* Help links */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-base text-ink">
              <button type="button" onClick={() => openTab("shipping")} className="flex min-h-11 items-center gap-2 hover:text-primary-hover">
                <Truck className="h-4 w-4" /> Delivery &amp; Return
              </button>
              <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
              <Link href="/contact" className="flex min-h-11 items-center gap-2 hover:text-primary-hover">
                <MessageCircleQuestion className="h-4 w-4" /> Ask a Question
              </Link>
              <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
              <button type="button" onClick={handleShare} className="flex min-h-11 items-center gap-2 hover:text-primary-hover">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <span role="status" aria-live="polite" className="text-sm text-ink-muted">
                {shareStatus}
              </span>
            </div>

            {/* Delivery / returns rows (existing store copy) */}
            <ul className="mt-2 space-y-2.5 border-b border-line pb-6 text-base text-ink-secondary">
              <li className="flex items-start gap-2.5">
                <Timer className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                <span>
                  Made to Order: <span className="font-medium text-ink">{leadTimeText}</span> production lead time.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                <span>
                  <span className="font-medium text-ink">Easy returns (7 days):</span> hassle-free size exchanges.
                </span>
              </li>
            </ul>

            {/* Meta */}
            <dl className="space-y-1.5 pt-6 text-base">
              {selectedVariant?.sku && (
                <div className="flex gap-1.5">
                  <dt className="text-ink">SKU:</dt>
                  <dd className="text-ink-secondary">{selectedVariant.sku}</dd>
                </div>
              )}
              {extras?.brand && (
                <div className="flex gap-1.5">
                  <dt className="text-ink">Brand:</dt>
                  <dd className="text-ink-secondary">{extras.brand}</dd>
                </div>
              )}
              <div className="flex gap-1.5">
                <dt className="text-ink">Available:</dt>
                <dd className="text-ink-secondary">{product.availabilityMode}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-ink">Category:</dt>
                <dd>
                  <Link href={`/collections?category=${product.category}`} className="capitalize text-ink-secondary hover:text-primary-hover">
                    {categoryLabel}
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="mx-auto max-w-[1320px] px-4 pt-14 sm:pt-20 lg:px-[15px]">
        <ProductTabs
          slug={product.slug}
          description={product.description}
          careLines={careLines}
          materialLines={materialLines}
          specs={specs}
          reviewCount={product.reviewCount}
          leadTime={leadTimeText}
          shippingInfo={product.shippingInfo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </section>

      {/* Related + recently viewed */}
      <ProductRecommendations currentId={product.id} related={relatedProducts} />

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={closeSizeGuide} />

      <StickyAddToCart
        watchRef={ctaRowRef}
        image={galleryImages[0]}
        title={product.title}
        price={product.price}
        compareAtPrice={product.compareAtPrice}
        summary={stickySummary}
        sizes={product.sizes}
        selectedSize={selectedSize}
        isSizeAvailable={(s) => sizeAvailable(variants, s, selectedColor?.name)}
        onSizeChange={handleSizeChange}
        onAdd={handleAddToCart}
        disabled={unavailable}
        disabledLabel="Currently unavailable"
      />
    </div>
  );
}
