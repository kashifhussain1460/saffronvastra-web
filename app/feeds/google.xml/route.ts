// Google Merchant Center product feed (RSS 2.0 with the g: namespace), one item per size of every Active product.
// Add https://www.saffronvastra.com/feeds/google.xml in Merchant Center as a scheduled fetch (daily).
// Values come only from the public product API and the store's shipping settings: nothing is invented.
import { API_ORIGIN, INDEXING_ALLOWED, SITE_URL } from "@/lib/site";
import { BRAND } from "@/lib/brand";
import { truncateAtWord } from "@/lib/seo";
import { absoluteUrl } from "@/lib/jsonld";
import { fetchSiteSettings } from "@/lib/siteSettings";

// Built on request, never at deploy time (the API may be unreachable from the build machine); the CDN keeps a copy
// for an hour, which is plenty for Merchant Center's daily fetch.
export const dynamic = "force-dynamic";
const CDN_CACHE = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

// Apparel & Accessories > Clothing > Outerwear > Coats & Jackets
const GOOGLE_PRODUCT_CATEGORY = "5598";
// Dispatch in 5–7 working days and 2–5 days in transit, as published on /policies/shipping.
const HANDLING_DAYS = { min: 5, max: 7 };
const TRANSIT_DAYS = { min: 2, max: 5 };

const xml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Plain text without emoji, pictographs or control characters (Merchant Center rejects some and shows the rest raw).
const plain = (text: unknown, max: number) =>
  truncateAtWord(
    String(text ?? "")
      .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍⃣]/gu, "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""),
    max
  );

const money = (rupees: number) => `${rupees.toFixed(2)} INR`;

async function allProducts(): Promise<any[]> {
  const items: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await fetch(`${API_ORIGIN}/api/v1/products?page=${page}&limit=50`, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Feed: products responded with ${res.status}`);
    const body = await res.json();
    const pageItems: any[] = body?.items || [];
    items.push(...pageItems);
    if (!pageItems.length || page >= (body.pagination?.totalPages || 1)) break;
  }
  return items.filter((item, i) => items.findIndex((other) => other.slug === item.slug) === i);
}

const materialOf = (material: unknown) =>
  String(material ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^fabric$/i.test(p))
    .join("/");

export async function GET(): Promise<Response> {
  // Staging and previews have no public catalogue to advertise.
  if (!INDEXING_ALLOWED) return new Response("Not found", { status: 404 });

  let products: any[];
  let settings: Awaited<ReturnType<typeof fetchSiteSettings>>;
  try {
    [products, settings] = await Promise.all([allProducts(), fetchSiteSettings()]);
  } catch {
    // a short or empty feed would make Merchant Center drop products, so fail and let it retry later
    return new Response("Feed temporarily unavailable", { status: 503, headers: { "Retry-After": "3600" } });
  }
  const { shipping } = settings;

  const entries: string[] = [];
  for (const p of products) {
    if (p.status && p.status !== "Active") continue;
    const link = `${SITE_URL}/products/${p.slug}`;
    const images = (p.images || [])
      .map((i: any) => absoluteUrl(typeof i === "string" ? i : i?.url))
      .filter(Boolean) as string[];
    if (!images.length) continue;
    const basePrice = (p.basePriceMinor || 0) / 100;
    const comparePrice = (p.comparePriceMinor || 0) / 100;
    const description = plain(p.description || p.shortDescription || p.title, 4900);
    // Etsy-style "A | B | C" titles read as "A – B – C"
    const title = plain(p.title, 140).replace(/\s*\|\s*/g, " – ");
    const material = materialOf(p.material);
    const unavailable = p.availabilityMode === "Unavailable";
    const variants: any[] = (p.variants || []).filter((v: any) => v?.sku && (!v.status || v.status === "Active"));
    const rows = variants.length ? variants : [{ sku: p.id, size: null }];

    for (const v of rows) {
      const price = typeof v.priceOverrideMinor === "number" ? v.priceOverrideMinor / 100 : basePrice;
      const onSale = comparePrice > price;
      const free = shipping.deliveryChargesEnabled === false || !shipping.flatFee || price >= shipping.freeShippingThreshold;
      const colour = v.colourName && v.colourName !== "Standard" ? v.colourName : "";
      entries.push(
        [
          "<item>",
          `<g:id>${xml(v.sku)}</g:id>`,
          `<g:item_group_id>${xml(p.id)}</g:item_group_id>`,
          `<g:title>${xml(v.size ? `${title} – Size ${v.size}` : title)}</g:title>`,
          `<g:description>${xml(description)}</g:description>`,
          `<g:link>${xml(link)}</g:link>`,
          `<g:image_link>${xml(images[0])}</g:image_link>`,
          ...images.slice(1, 11).map((u) => `<g:additional_image_link>${xml(u)}</g:additional_image_link>`),
          `<g:availability>${unavailable ? "out_of_stock" : "in_stock"}</g:availability>`,
          // the higher "compare at" price is the regular price; the shop price is then the sale price
          onSale ? `<g:price>${money(comparePrice)}</g:price><g:sale_price>${money(price)}</g:sale_price>` : `<g:price>${money(price)}</g:price>`,
          `<g:brand>${xml(BRAND.displayName)}</g:brand>`,
          "<g:identifier_exists>no</g:identifier_exists>",
          "<g:condition>new</g:condition>",
          `<g:google_product_category>${GOOGLE_PRODUCT_CATEGORY}</g:google_product_category>`,
          p.category?.name ? `<g:product_type>${xml(p.category.name)}</g:product_type>` : "",
          // the size guide is unisex
          "<g:gender>unisex</g:gender>",
          "<g:age_group>adult</g:age_group>",
          v.size ? `<g:size>${xml(v.size)}</g:size>` : "",
          colour ? `<g:color>${xml(colour)}</g:color>` : "",
          material ? `<g:material>${xml(material)}</g:material>` : "",
          `<g:shipping><g:country>IN</g:country><g:price>${money(free ? 0 : shipping.flatFee)}</g:price>` +
            `<g:min_handling_time>${HANDLING_DAYS.min}</g:min_handling_time><g:max_handling_time>${Math.max(HANDLING_DAYS.max, Number(p.leadTimeDays) || 0)}</g:max_handling_time>` +
            `<g:min_transit_time>${TRANSIT_DAYS.min}</g:min_transit_time><g:max_transit_time>${TRANSIT_DAYS.max}</g:max_transit_time></g:shipping>`,
          "</item>",
        ]
          .filter(Boolean)
          .join("")
      );
    }
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>' +
    `<title>${xml(BRAND.displayName)}</title><link>${xml(SITE_URL)}</link>` +
    `<description>${xml(`${BRAND.displayName} product feed`)}</description>\n` +
    entries.join("\n") +
    "\n</channel></rss>\n";

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": CDN_CACHE },
  });
}
