// Shared page metadata: one title suffix, one set of base Open Graph fields and one canonical rule for every route.
// Relative paths (canonical, og:url, images) resolve against metadataBase (SITE_URL) set in app/layout.tsx.
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

// Brand part of every page title ("FAQs | SaffronVastra"). One constant so the owner's spelling choice is a one-line change.
export const BRAND_TITLE_SUFFIX = BRAND.name;

// Browser chrome and manifest colours, taken from the app/globals.css tokens (keep them in step if the tokens change).
export const THEME_COLOR = "#181818"; // --color-primary / --color-ink
export const BACKGROUND_COLOR = "#FFFFFF"; // --color-canvas

// Open Graph fields shared by every page. A page's openGraph replaces the root one entirely, so pages spread this in.
export const BASE_OG = {
  siteName: BRAND.name,
  locale: "en_IN",
  type: "website",
} as const;

type OgImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;

export interface BuildMetadataInput {
  // Page part of the title only ("FAQs"); the root template adds the brand suffix.
  title: string;
  description: string;
  // Site-relative canonical path, for example "/faqs" or "/collections?category=suzani-jackets".
  path: string;
  images?: OgImages;
  type?: "website" | "article";
  // Keeps the page out of search results (robots noindex, nofollow).
  noindex?: boolean;
  // Use the title exactly as given, without the brand suffix (home page, owner-written seoTitle).
  absoluteTitle?: boolean;
}

// Full document title for a page part, matching what the root title template renders.
export function titleFor(pageTitle: string): string {
  return `${pageTitle} | ${BRAND_TITLE_SUFFIX}`;
}

// Title of every 404 page (app/not-found.tsx). Dynamic routes use the same title for a missing record, so the title in
// the server HTML (rendered from not-found.tsx) and the one the browser ends up with (streamed from generateMetadata)
// are the same text.
export const NOT_FOUND_TITLE = "Page not found";

// Metadata for a dynamic route whose record does not exist. No robots value: Next adds <meta name="robots"
// content="noindex"> to every 404 response, and a second tag would duplicate it. No canonical and no og:url, so a
// missing record never claims a URL and does not inherit one from a parent layout.
export function notFoundMetadata(): Metadata {
  return {
    title: NOT_FOUND_TITLE,
    alternates: { canonical: null },
    openGraph: { ...BASE_OG, title: titleFor(NOT_FOUND_TITLE) },
  };
}

const hasImages = (images: OgImages | undefined): images is OgImages =>
  Array.isArray(images) ? images.length > 0 : Boolean(images);

// Metadata for one route: title, description, self-canonical, Open Graph and Twitter card.
// Robots is only set for noindex pages, so everything else inherits the root (environment-aware) value.
export function buildMetadata({
  title,
  description,
  path,
  images,
  type = "website",
  noindex = false,
  absoluteTitle = false,
}: BuildMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : titleFor(title);
  const withImages = hasImages(images);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...BASE_OG,
      type,
      url: path,
      title: fullTitle,
      description,
      ...(withImages ? { images } : {}),
    },
    twitter: withImages
      ? { card: "summary_large_image", title: fullTitle, description, images }
      : { card: "summary", title: fullTitle, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

// Plain text from simple Markdown or HTML: tags, links, images, headings, list markers, emphasis and code marks removed.
function toPlainText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|nbsp|quot|#39|apos|lt|gt);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/```[^\n]*\n?/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*(?:[-*_]\s*){3,}$/gm, " ")
    .replace(/\*\*|__|~~|`/g, "")
    .replace(/(^|[\s(])[*_](\S(?:[^*_\n]*\S)?)[*_](?=[\s).,;:!?]|$)/gm, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

// Plain-text excerpt of at most `max` characters, cut at a word boundary. "…" is appended only when text was cut.
export function truncateAtWord(text: string, max: number): string {
  const plain = toPlainText(text || "");
  if (plain.length <= max) return plain;
  if (max <= 1) return max === 1 ? "…" : "";

  const room = max - 1; // leave space for the ellipsis
  let cut = plain.slice(0, room);
  if (plain[room] !== " ") {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }
  cut = cut.replace(/[\s,;:.\-–—(]+$/u, "");
  return `${cut}…`;
}
