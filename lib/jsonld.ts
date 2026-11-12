// Structured data (schema.org JSON-LD) builders. Pure functions: stored values only, no invented stock, shipping,
// ratings or contact details. Every URL is absolute, built from SITE_URL. Render the result with <JsonLd data={…} />.
import { BRAND } from "@/lib/brand";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import { truncateAtWord } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export type JsonLdNode = Record<string, unknown>;

const CONTEXT = "https://schema.org";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const LOGO_PATH = "/images/brand/saffronvastra-logo.png";

// Absolute URL for a site-relative path or an already absolute URL. Empty input gives undefined.
export function absoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Emoji variation selectors, joiners, keycap marks and control characters (newlines become spaces in truncateAtWord).
const INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‍⁠︎️⃣]/g;

// Plain-text description of at most `max` characters, cut at a word boundary.
function plainDescription(text: unknown, max: number): string {
  return truncateAtWord(String(text ?? "").replace(INVISIBLE_CHARS, ""), max);
}

// Several nodes in one document. Nested "@context" keys are dropped because the document carries one.
export function graph(...nodes: JsonLdNode[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@graph": nodes.map((node) => {
      const copy = { ...node };
      delete copy["@context"];
      return copy;
    }),
  };
}

// The brand's own profiles elsewhere (Etsy shop, Instagram, Pinterest…), from BRAND_SAME_AS: comma-separated absolute
// URLs set by the owner. Only http(s) URLs are kept; nothing is listed until the owner provides them.
export function sameAsProfiles(): string[] {
  return String(process.env.BRAND_SAME_AS || "")
    .split(",")
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\/\S+$/.test(u));
}

// The shop itself. contactPoint and address are left out until the owner confirms them.
export function organization(): JsonLdNode {
  const sameAs = sameAsProfiles();
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BRAND.displayName,
    url: SITE_URL,
    logo: absoluteUrl(LOGO_PATH),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

// The site. /search?q= renders the API's search results (app/search/page.tsx), so it is declared as the search action.
export function website(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: BRAND.displayName,
    inLanguage: "en-IN",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

// Organization and WebSite for every page (root layout).
export function siteGraph(): JsonLdNode {
  return graph(organization(), website());
}

export interface Crumb {
  name: string;
  // Site-relative path or absolute URL. Only the last crumb (the current page) should omit it.
  path?: string;
}

// Breadcrumb trail in visible order. Positions start at 1.
export function breadcrumbList(crumbs: Crumb[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => {
      const item = absoluteUrl(crumb.path);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: String(crumb.name).trim(),
        ...(item ? { item } : {}),
      };
    }),
  };
}

const AVAILABILITY: Record<string, string> = {
  "Made to Order": "https://schema.org/MadeToOrder",
  "Available to Order": "https://schema.org/MadeToOrder",
  Unavailable: "https://schema.org/OutOfStock",
};

// Shipping rules for structured data: the same public store settings the checkout uses (lib/siteSettings).
export interface ShippingRules {
  deliveryChargesEnabled?: boolean;
  freeShippingThreshold: number; // rupees
  flatFee: number; // rupees
}

// Delivery promises published on /policies/shipping: dispatch in 5–7 working days, then 2–5 business days in transit
// (2–3 to metros, 3–5 elsewhere). Keep these in step with that page.
const HANDLING_DAYS_MIN = 5;
const HANDLING_DAYS_MAX = 7;
const TRANSIT_DAYS_MIN = 2;
const TRANSIT_DAYS_MAX = 5;

// India-only delivery for one item at this price, with the charge the checkout would apply.
function shippingDetails(price: number, rules: ShippingRules, leadTimeDays?: number | null): JsonLdNode {
  const free = rules.deliveryChargesEnabled === false || !rules.flatFee || price >= rules.freeShippingThreshold;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: free ? 0 : rules.flatFee, currency: "INR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: HANDLING_DAYS_MIN,
        maxValue: Math.max(HANDLING_DAYS_MAX, Number(leadTimeDays) || 0),
        unitCode: "DAY",
      },
      transitTime: { "@type": "QuantitativeValue", minValue: TRANSIT_DAYS_MIN, maxValue: TRANSIT_DAYS_MAX, unitCode: "DAY" },
    },
  };
}

// The returns policy published on /policies/returns: exchange within 7 days of delivery, India only.
const RETURN_POLICY: JsonLdNode = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IN",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  returnMethod: "https://schema.org/ReturnByMail",
  refundType: "https://schema.org/ExchangeRefund",
};

// "Cotton, Fabric, Velvet" -> "Cotton, Velvet": the generic word "Fabric" from the Etsy import is not a material.
function materialName(material: unknown): string | undefined {
  const parts = String(material ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^fabric$/i.test(p));
  return parts.length ? parts.join(", ") : undefined;
}

// A real colour name only: "Standard" is the placeholder used while colour variants are switched off.
function colourName(variants: any[]): string | undefined {
  const names = [...new Set(variants.map((v) => String(v?.colourName ?? "").trim()).filter((n) => n && n !== "Standard"))];
  return names.length === 1 ? names[0] : undefined;
}

// The product's brand: the shop's own pieces always carry the spaced spelling, so search sees one brand.
function brandName(stored: unknown): string {
  const name = String(stored ?? "").trim();
  return !name || name.replace(/\s+/g, "").toLowerCase() === BRAND.name.toLowerCase() ? BRAND.displayName : name;
}

// Product from the API product payload (GET /api/v1/products/:slug). A product sold in several sizes is a
// ProductGroup with one Product per size (sku, size, own Offer) — Google's single-page variant form. The price is the
// same rupee amount the product page shows; a size with its own price override uses that amount.
export function product(data: any, shipping?: ShippingRules): JsonLdNode {
  const url = `${SITE_URL}/products/${data.slug}`;
  const images = (data.images || [])
    .map((i: any) => absoluteUrl(typeof i === "string" ? i : i?.url))
    .filter(Boolean);
  const description = plainDescription(data.seoDescription || data.shortDescription || data.description, 300);
  const { price } = mapBackendProductToFrontend(data);
  const availability = AVAILABILITY[data.availabilityMode];
  const variants: any[] = (data.variants || []).filter((v: any) => v?.sku && v?.size && (!v.status || v.status === "Active"));
  const material = materialName(data.material);
  const color = colourName(variants);
  const brand = { "@type": "Brand", name: brandName(data.brand) };

  const offer = (amount: number): JsonLdNode => ({
    "@type": "Offer",
    price: amount,
    priceCurrency: "INR",
    url,
    itemCondition: "https://schema.org/NewCondition",
    ...(availability ? { availability } : {}),
    ...(shipping ? { shippingDetails: shippingDetails(amount, shipping, data.leadTimeDays) } : {}),
    hasMerchantReturnPolicy: RETURN_POLICY,
  });

  const shared: JsonLdNode = {
    ...(description ? { description } : {}),
    image: images,
    brand,
    ...(data.category?.name ? { category: data.category.name } : {}),
    ...(material ? { material } : {}),
    ...(color ? { color } : {}),
  };

  const ld: JsonLdNode =
    variants.length > 1
      ? {
          "@context": CONTEXT,
          "@type": "ProductGroup",
          name: data.title,
          url,
          productGroupID: data.id || data.slug,
          variesBy: ["https://schema.org/size"],
          ...shared,
          hasVariant: variants.map((v) => ({
            "@type": "Product",
            name: `${data.title} – Size ${v.size}`,
            sku: v.sku,
            size: v.size,
            ...shared,
            offers: offer(typeof v.priceOverrideMinor === "number" ? v.priceOverrideMinor / 100 : price),
          })),
        }
      : {
          "@context": CONTEXT,
          "@type": "Product",
          name: data.title,
          url,
          ...(variants[0]?.sku ? { sku: variants[0].sku } : {}),
          ...(variants[0]?.size ? { size: variants[0].size } : {}),
          ...shared,
          offers: offer(price),
        };
  // Only a real rating backed by at least one review.
  if (typeof data.rating === "number" && data.reviewsCount > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: data.rating, reviewCount: data.reviewsCount };
  }
  return ld;
}

// An information page about the shop itself (AboutPage, ContactPage), linked to the Organization and the WebSite.
export function infoPage(type: "AboutPage" | "ContactPage", path: string, name: string, description: string): JsonLdNode {
  const url = `${SITE_URL}${path}`;
  return {
    "@context": CONTEXT,
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
  };
}

export interface StoryInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  coverImage?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

// Journal story (GET /api/v1/journal/:slug). The description matches the page's meta description.
export function blogPosting(story: StoryInput): JsonLdNode {
  const url = `${SITE_URL}/journal/${story.slug}`;
  const description = plainDescription(story.excerpt || story.body, 155);
  const image = absoluteUrl(story.coverImage);
  const publisher = { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.displayName, url: SITE_URL, logo: absoluteUrl(LOGO_PATH) };
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: story.title,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(story.publishedAt ? { datePublished: story.publishedAt } : {}),
    ...(story.updatedAt || story.publishedAt ? { dateModified: story.updatedAt || story.publishedAt } : {}),
    ...(story.category ? { articleSection: story.category } : {}),
    inLanguage: "en-IN",
    author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.displayName, url: SITE_URL },
    publisher,
  };
}
