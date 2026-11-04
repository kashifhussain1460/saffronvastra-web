import { Product, Size, ProductColor, AvailabilityMode } from "@/types";

// Etsy-hosted photos are stored as the full-size original (il_fullxfull, 2048-2250 px wide, 0.5-1.1 MB). Etsy serves
// the same photo at fixed widths from the same address with a different size segment; the height follows the photo,
// so the aspect ratio never changes. Fixed-box crops (for example il_340x270) are not matched.
const ETSY_SIZED = /^(https?:\/\/i\.etsystatic\.com\/[^?#]*\/)il_(?:fullxfull|\d+xN)\.([^/?#]+\.jpg)$/i;

/**
 * Etsy widths used by the storefront: 794 px for the product page gallery, 570 px for cards and thumbnails,
 * fullxfull for the original.
 */
export type EtsyImageSize = "794xN" | "570xN" | "fullxfull";

/**
 * Returns the Etsy photo at the given width. Any other address (local /images or /uploads files, Blob addresses,
 * an Etsy address in another form) is returned unchanged.
 */
export function etsyImageUrl(url: string, size: EtsyImageSize): string {
  const match = typeof url === "string" ? ETSY_SIZED.exec(url) : null;
  return match ? `${match[1]}il_${size}.${match[2]}` : url;
}

// Category photos in public/images/categories that also exist as a 1000 px wide copy (<slug>-1000.jpg, the same
// artwork re-encoded from the 1200x1500 original, same 4:5 ratio).
const CATEGORY_IMAGES_1000 = new Set([
  "chikankari",
  "chikankari-dresses",
  "chikankari-jackets",
  "chikankari-kurtas",
  "chikankari-shirts",
  "kashmiri-coats",
  "kashmiri-jackets",
  "kashmiri-kari",
  "kashmiri-kimonos",
  "kashmiri-shawls",
  "suzani-accessories",
  "suzani-coats",
  "suzani-jackets",
  "suzani-kimonos",
  "suzani-stitchwork",
]);
const CATEGORY_IMAGE = /^\/images\/categories\/([a-z-]+)\.jpg$/;

/**
 * Returns the 1000 px copy of a bundled category photo (/images/categories/<slug>.jpg) when one exists. Any other
 * address (an uploaded or Blob image, a slug without a copy) is returned unchanged.
 */
export function categoryImageUrl(url: string): string {
  const match = typeof url === "string" ? CATEGORY_IMAGE.exec(url) : null;
  return match && CATEGORY_IMAGES_1000.has(match[1]) ? `/images/categories/${match[1]}-1000.jpg` : url;
}

export function mapBackendProductToFrontend(raw: any): Product {
  const price = Math.round((raw.basePriceMinor || 0) / 100);
  const compareAtPrice = raw.comparePriceMinor ? Math.round(raw.comparePriceMinor / 100) : undefined;

  // Only the single-product response (GET /products/:slug) carries relatedProducts. Its photos fill the product page
  // gallery (shown up to half the page wide), so they use the 794 px copy; list responses feed cards and use 570 px.
  const imageSize: EtsyImageSize = Array.isArray(raw.relatedProducts) ? "794xN" : "570xN";

  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.map((img: any) => etsyImageUrl(typeof img === "string" ? img : img.url, imageSize));
  } else {
    images = ["/images/brand/saffronvastra-mark.png"];
  }

  // Derive sizes from variants if present
  let sizes: Size[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    const rawSizes = raw.variants.map((v: any) => v.size);
    const validSizes: string[] = ["S", "M", "L", "XL", "Free Size"];
    sizes = Array.from(new Set(rawSizes)).filter((s): s is Size =>
      typeof s === "string" && validSizes.includes(s)
    );
  }
  if (sizes.length === 0) {
    sizes = ["S", "M", "L", "XL"];
  }

  // Derive colors from variants if present
  let colors: ProductColor[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    const colorMap = new Map<string, ProductColor>();
    for (const v of raw.variants) {
      const name = v.colourName || "Standard";
      const hex = v.colourHex || "#1A1A1A";
      if (!colorMap.has(name)) {
        colorMap.set(name, { name, hex });
      }
    }
    colors = Array.from(colorMap.values());
  }
  if (colors.length === 0) {
    colors = [{ name: "Standard", hex: "#1A1A1A" }];
  }

  const badges: ("BESTSELLER" | "NEW" | "LIMITED")[] = [];
  if (raw.isBestseller) badges.push("BESTSELLER");
  if (raw.isNewArrival) badges.push("NEW");

  // Determine fabric per Spec v1.1: Jackets default to Cotton Velvet; Kimonos specify individual fabric
  const catSlug = (raw.category?.slug || "").toLowerCase();
  const isKimono = catSlug.includes("kimono") || (raw.title || "").toLowerCase().includes("kimono");
  let fabric: "Velvet" | "Cotton" | "Silk" | "Linen" = isKimono ? "Cotton" : "Velvet";
  const mat = (raw.material || "").toLowerCase();
  if (mat.includes("silk")) fabric = "Silk";
  else if (mat.includes("linen")) fabric = "Linen";
  else if (mat.includes("cotton")) fabric = "Cotton";
  else if (mat.includes("velvet")) fabric = "Velvet";

  return {
    id: raw.id || "prod-1",
    slug: raw.slug || "maroon-velvet-embroidered-jacket",
    title: raw.title || "Handcrafted Suzani Jacket",
    subtitle: raw.shortDescription || undefined,
    createdAt: raw.createdAt || undefined,
    price,
    compareAtPrice,
    description: raw.description || "Handcrafted made-to-order garment crafted by master artisans in Rajasthan.",
    details: [
      raw.material ? `${raw.material}` : (isKimono ? "Pure natural cotton fabric with breathable lining" : "Premium cotton velvet fabric with soft satin lining"),
      raw.embroidery ? `Intricate ${raw.embroidery} needlework` : "Intricate hand embroidery by master artisans",
      "Relaxed contemporary silhouette with structured tailoring",
      "Full sleeves with handcrafted cuffs and premium lining",
      "Exclusively made to order in our Jaipur workshop",
    ],
    fabricCare:
      typeof raw.careInstructions === "string" && raw.careInstructions.trim()
        ? raw.careInstructions.split(String.fromCharCode(10)).map((l: string) => l.trim()).filter(Boolean)
        : [
            "Dry clean only",
            "Store in a breathable cotton garment bag",
            "Avoid direct sunlight and high humidity",
            "Do not iron directly on embroidery; use light steam",
          ],
    shippingInfo: "Free shipping across India on orders above ₹5,000. Handcrafted & dispatched within 5–7 business days.",
    leadTime: raw.leadTimeDays ? `${raw.leadTimeDays} business days` : "5-7 business days",
    category: raw.category?.slug || "jackets",
    collection: raw.collections?.[0]?.collection?.slug || "velvet-collection",
    rating: typeof raw.rating === "number" && raw.reviewsCount > 0 ? raw.rating : 0,
    reviewCount: raw.reviewsCount ?? 0,
    images,
    badges: badges.length > 0 ? badges : undefined,
    sizes,
    colors,
    availabilityMode: (raw.availabilityMode as AvailabilityMode) || "Made to Order",
    fabric,
    embroideryStyle: "Traditional",
    occasion: "Festive",
  };
}
