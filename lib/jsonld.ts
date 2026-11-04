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

// The shop itself. contactPoint, address and sameAs are left out until the owner confirms them.
export function organization(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BRAND.name,
    url: SITE_URL,
    logo: absoluteUrl(LOGO_PATH),
  };
}

// The site. /search?q= renders the API's search results (app/search/page.tsx), so it is declared as the search action.
export function website(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: BRAND.name,
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

// Product from the API product payload (GET /api/v1/products/:slug). One Offer covers every size, so no
// product-level sku is given. The price is the same rupee amount the product page shows.
export function product(data: any): JsonLdNode {
  const url = `${SITE_URL}/products/${data.slug}`;
  const images = (data.images || [])
    .map((i: any) => absoluteUrl(typeof i === "string" ? i : i?.url))
    .filter(Boolean);
  const description = plainDescription(data.seoDescription || data.shortDescription || data.description, 300);
  const { price } = mapBackendProductToFrontend(data);
  const availability = AVAILABILITY[data.availabilityMode];

  const ld: JsonLdNode = {
    "@context": CONTEXT,
    "@type": "Product",
    name: data.title,
    ...(description ? { description } : {}),
    image: images,
    url,
    ...(data.brand ? { brand: { "@type": "Brand", name: data.brand } } : {}),
    ...(data.category?.name ? { category: data.category.name } : {}),
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "INR",
      url,
      ...(availability ? { availability } : {}),
    },
  };
  // Only a real rating backed by at least one review.
  if (typeof data.rating === "number" && data.reviewsCount > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: data.rating, reviewCount: data.reviewsCount };
  }
  return ld;
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
  const publisher = { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name, url: SITE_URL, logo: absoluteUrl(LOGO_PATH) };
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
    author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name, url: SITE_URL },
    publisher,
  };
}
