import { BRAND } from "@/lib/brand";
import { cache } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import ProductDetailClient, { type ProductExtras } from "./ProductDetailClient";
import { SITE_URL } from "@/lib/site";

const absolute = (url?: string | null) => (!url ? undefined : /^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

// Structured data from stored values only: no invented stock, shipping or ratings.
function productJsonLd(data: any) {
  const images = (data.images || []).map((i: any) => absolute(i.url)).filter(Boolean);
  const availability: Record<string, string> = {
    "Made to Order": "https://schema.org/MadeToOrder",
    "Available to Order": "https://schema.org/MadeToOrder",
    Unavailable: "https://schema.org/OutOfStock",
  };
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.title,
    description: data.seoDescription || data.shortDescription || String(data.description || "").slice(0, 300),
    image: images,
    url: `${SITE_URL}/products/${data.slug}`,
    ...(data.variants?.[0]?.sku ? { sku: data.variants[0].sku } : {}),
    ...(data.brand ? { brand: { "@type": "Brand", name: data.brand } } : {}),
    ...(data.category?.name ? { category: data.category.name } : {}),
    offers: {
      "@type": "Offer",
      price: (data.basePriceMinor / 100).toFixed(2),
      priceCurrency: data.currency || "INR",
      url: `${SITE_URL}/products/${data.slug}`,
      ...(availability[data.availabilityMode] ? { availability: availability[data.availabilityMode] } : {}),
    },
  };
  if (typeof data.rating === "number" && data.reviewsCount > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: data.rating, reviewCount: data.reviewsCount };
  }
  return ld;
}

// Always render from the live catalogue so published, edited and unpublished
// products are reflected immediately.
export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:4000";
const SESSION_COOKIE_NAME = "saffron_session";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// One API call per request, shared by the page and its metadata.
// The session is forwarded so an administrator can preview a Draft product; the API alone
// decides visibility, and anonymous visitors only ever get Active products.
const loadProduct = cache(async (slug: string) => {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const res = await fetch(`${API_ORIGIN}/api/v1/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: session ? { Cookie: `${SESSION_COOKIE_NAME}=${session}` } : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Product service responded with ${res.status}`);
  return (await res.json()).data;
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProduct(slug);
  if (!data) return { title: `Product not found | ${BRAND.name}` };
  const title = data.seoTitle || `${data.title} | ${BRAND.name}`;
  const description = data.seoDescription || data.shortDescription || String(data.description || "").slice(0, 160);
  const cover = (data.images || []).find((i: any) => i.isCover) || data.images?.[0];
  return {
    title,
    description,
    alternates: { canonical: `/products/${data.slug}` },
    // a Draft product previewed by an administrator must never be indexed
    ...(data.status !== "Active" ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: `/products/${data.slug}`,
      ...(cover ? { images: [{ url: absolute(cover.url)!, alt: cover.altText || data.title }] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await loadProduct(slug);
  if (!data) notFound();

  const product = mapBackendProductToFrontend(data);
  const relatedProducts = (data.relatedProducts ?? []).map(mapBackendProductToFrontend);
  // stored fields the mapped product does not carry (real values only, nothing derived)
  const extras: ProductExtras = {
    variants: (data.variants ?? []).map((v: any) => ({
      id: v.id,
      sku: v.sku ?? null,
      size: v.size,
      colourName: v.colourName ?? null,
      colourHex: v.colourHex ?? null,
      status: v.status ?? null,
    })),
    imageAlts: (data.images ?? []).map((i: any) => (typeof i === "string" ? "" : i.altText || "")),
    material: data.material ?? null,
    embroidery: data.embroidery ?? null,
    careInstructions: data.careInstructions ?? null,
    leadTimeDays: data.leadTimeDays ?? null,
    brand: data.brand ?? null,
    productType: data.productType ?? null,
    categoryName: data.category?.name ?? null,
    collectionName: data.collections?.[0]?.collection?.name ?? null,
  };

  return (
    <>
      {data.status === "Active" && (
        <script
          type="application/ld+json"
          // JSON.stringify escapes quotes; "<" is escaped so the data can never close the script tag
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(data)).replace(/</g, String.fromCharCode(92) + "u003c") }}
        />
      )}
      <ProductDetailClient product={product} relatedProducts={relatedProducts} extras={extras} />
    </>
  );
}
