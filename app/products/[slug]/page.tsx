import { cache } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import ProductDetailClient, { type ProductExtras } from "./ProductDetailClient";
import { API_ORIGIN } from "@/lib/site";
import { buildMetadata, notFoundMetadata, titleFor, truncateAtWord } from "@/lib/seo";
import { absoluteUrl, breadcrumbList, graph, product as productJsonLd, type Crumb } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";

// Always render from the live catalogue so published, edited and unpublished
// products are reflected immediately.
// There is deliberately no loading.tsx for this route: a loading boundary lets the response start (status 200) before
// the product is fetched, so a missing product would be a soft 404 and the metadata would stream into <body>.
export const dynamic = "force-dynamic";

const SESSION_COOKIE_NAME = "saffron_session";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// One API call per request, shared by the page and its metadata. null means the product does not exist or is not
// public (a real 404); any other failure is thrown so the error page answers with a 500 instead of a "not found".
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

const TITLE_MAX = 60;

// Document title for a product. An owner-written seoTitle is used exactly as stored. Otherwise the product title
// goes through the root template ("<title> | Brand") when that fits in 60 characters; a longer title falls back to
// its first " | " segment, still branded when that fits, and used whole without the brand when it does not.
// A title is never cut mid-phrase.
function productTitle(data: any): { title: string; absoluteTitle: boolean } {
  const seoTitle = String(data.seoTitle || "").trim();
  if (seoTitle) return { title: seoTitle, absoluteTitle: true };
  const full = String(data.title || "").trim();
  if (titleFor(full).length <= TITLE_MAX) return { title: full, absoluteTitle: false };
  const segment = full.split(" | ")[0].trim() || full;
  if (titleFor(segment).length <= TITLE_MAX) return { title: segment, absoluteTitle: false };
  return { title: segment, absoluteTitle: true };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProduct(slug);
  // No canonical, so a missing product never claims a URL; the same title as the 404 page itself (see notFoundMetadata).
  if (!data) return notFoundMetadata();
  const { title, absoluteTitle } = productTitle(data);
  const description = data.seoDescription || data.shortDescription || truncateAtWord(String(data.description || ""), 155);
  const cover = (data.images || []).find((i: any) => i.isCover) || data.images?.[0];
  // the same rupee amount the product page shows
  const { price } = mapBackendProductToFrontend(data);
  const metadata = buildMetadata({
    title,
    absoluteTitle,
    description,
    path: `/products/${data.slug}`,
    ...(cover ? { images: [{ url: absoluteUrl(cover.url)!, alt: cover.altText || data.title }] } : {}),
    // a Draft product previewed by an administrator must never be indexed
    noindex: data.status !== "Active",
  });
  return {
    ...metadata,
    other: {
      "product:price:amount": String(price),
      "product:price:currency": "INR",
    },
  };
}

// Breadcrumb trail for the structured data: Home > [parent category] > category > product, from the category and
// parent the product API returns. Category levels link to the same /collections?category= pages the site links to.
function productCrumbs(data: any): Crumb[] {
  const category = data.category;
  return [
    { name: "Home", path: "/" },
    ...(category?.parent?.name && category.parent.slug
      ? [{ name: category.parent.name, path: `/collections?category=${category.parent.slug}` }]
      : []),
    ...(category?.name && category.slug ? [{ name: category.name, path: `/collections?category=${category.slug}` }] : []),
    { name: String(data.title || "").trim() },
  ];
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
    categoryParentName: data.category?.parent?.name ?? null,
    categoryParentSlug: data.category?.parent?.slug ?? null,
    collectionName: data.collections?.[0]?.collection?.name ?? null,
  };

  return (
    <>
      {/* structured data for public products only, never for a Draft previewed by an administrator */}
      {data.status === "Active" && <JsonLd data={graph(productJsonLd(data), breadcrumbList(productCrumbs(data)))} />}
      <ProductDetailClient product={product} relatedProducts={relatedProducts} extras={extras} />
    </>
  );
}
