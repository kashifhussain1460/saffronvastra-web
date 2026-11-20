import { cache } from "react";
import type { Metadata } from "next";
import { cookies, draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import ProductDetailClient, { type ProductExtras } from "./ProductDetailClient";
import { API_ORIGIN } from "@/lib/site";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { buildMetadata, notFoundMetadata, titleFor, truncateAtWord } from "@/lib/seo";
import { absoluteUrl, breadcrumbList, graph, product as productJsonLd, type Crumb } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import PreviewBanner from "@/components/layout/PreviewBanner";
import { fetchSiteSettings } from "@/lib/siteSettings";
import type { InitialReviews } from "@/lib/reviews";

// Incremental static regeneration: each product page is rendered on its first visit, served from Vercel's edge cache,
// and rebuilt in the background at most once a minute, so published, edited and unpublished products show up within
// about a minute. If the API fails during a rebuild, the last good page keeps being served.
// Administrators preview Draft products, or edits before the cache refreshes, through preview mode (app/api/preview):
// the page then renders live on every request with their session.
// There is deliberately no loading.tsx for this route: a loading boundary lets the response start (status 200) before
// the product is fetched, so a missing product would be a soft 404 and the metadata would stream into <body>.
export const revalidate = 60;

// No product is rendered at build time (the API may be unreachable from the build machine); each one is rendered on
// its first visit and cached from then on.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// One API call per request, shared by the page and its metadata. null means the product does not exist or is not
// public (a real 404); any other failure is thrown so the error page answers with a 500 instead of a "not found".
// The API alone decides visibility: anonymous requests (every cached render) only ever get Active products. Only in
// preview mode is the administrator's session forwarded, so a Draft can be shown to them.
const loadProduct = cache(async (slug: string) => {
  const { isEnabled: preview } = await draftMode();
  const session = preview ? (await cookies()).get(SESSION_COOKIE_NAME)?.value : undefined;
  const res = await fetch(
    `${API_ORIGIN}/api/v1/products/${encodeURIComponent(slug)}`,
    session
      ? { cache: "no-store", headers: { Cookie: `${SESSION_COOKIE_NAME}=${session}` } }
      : { next: { revalidate: 60 } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Product service responded with ${res.status}`);
  return { data: (await res.json()).data, preview };
});

// The latest approved reviews of a public product, for the page HTML (Reviews tab) and its structured data, so Google
// sees the same reviews in both. Only fetched when the product has approved reviews; any failure gives null and the
// tab then loads them in the browser as before (the page itself never fails because of reviews).
async function loadApprovedReviews(slug: string, reviewsCount: number): Promise<InitialReviews | null> {
  if (!(reviewsCount > 0)) return null;
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/reviews/product/${encodeURIComponent(slug)}?limit=10`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.data || !Array.isArray(body.items)) return null;
    return { summary: body.data, items: body.items };
  } catch {
    return null;
  }
}

// A product shoppers and search engines may see. Outside preview mode the API only returns public products, so this is
// always true there; in preview mode it depends on the stored status (a Draft must never be indexed).
const isPublic = (data: any, preview: boolean) => !preview || data.status === "Active";

// The image to show when the page is shared: the cover, unless it is a PNG (some uploads are 2 MB+ PNGs, which
// WhatsApp and other apps skip), in which case the first JPEG/WebP photo of the product.
function shareImage(images: any[]): any | undefined {
  const cover = images.find((i) => i.isCover) || images[0];
  const isPng = (img: any) => /\.png(?:$|\?)/i.test(String(img?.url || ""));
  return cover && isPng(cover) ? images.find((i) => !isPng(i)) || cover : cover;
}

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
  const loaded = await loadProduct(slug);
  // No canonical, so a missing product never claims a URL; the same title as the 404 page itself (see notFoundMetadata).
  if (!loaded) return notFoundMetadata();
  const { data, preview } = loaded;
  const { title, absoluteTitle } = productTitle(data);
  const description = data.seoDescription || data.shortDescription || truncateAtWord(String(data.description || ""), 155);
  const image = shareImage(data.images || []);
  // the same rupee amount the product page shows
  const { price } = mapBackendProductToFrontend(data);
  const metadata = buildMetadata({
    title,
    absoluteTitle,
    description,
    path: `/products/${data.slug}`,
    ...(image ? { images: [{ url: absoluteUrl(image.url)!, alt: image.altText || data.title }] } : {}),
    // a Draft product previewed by an administrator must never be indexed
    noindex: !isPublic(data, preview),
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
  const loaded = await loadProduct(slug);
  if (!loaded) notFound();
  const { data, preview } = loaded;
  const publicProduct = isPublic(data, preview);

  // shipping charge and free-delivery threshold for the structured data, from the same settings the checkout uses
  const [{ shipping }, reviews] = publicProduct
    ? await Promise.all([fetchSiteSettings(), loadApprovedReviews(data.slug, data.reviewsCount)])
    : [{ shipping: undefined }, null];
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
    measurements: data.measurements ?? null,
    initialReviews: reviews,
  };

  return (
    <>
      {preview && <PreviewBanner path={`/products/${data.slug}`} status={data.status} />}
      {/* structured data for public products only, never for a Draft previewed by an administrator */}
      {publicProduct && <JsonLd data={graph(productJsonLd(data, shipping, reviews?.items ?? []), breadcrumbList(productCrumbs(data)))} />}
      <ProductDetailClient product={product} relatedProducts={relatedProducts} extras={extras} />
    </>
  );
}
