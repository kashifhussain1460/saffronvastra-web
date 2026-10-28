import { Product, Size, ProductColor, AvailabilityMode } from "@/types";

export function mapBackendProductToFrontend(raw: any): Product {
  const price = Math.round((raw.basePriceMinor || 0) / 100);
  const compareAtPrice = raw.comparePriceMinor ? Math.round(raw.comparePriceMinor / 100) : undefined;

  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.map((img: any) => (typeof img === "string" ? img : img.url));
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

  // Determine fabric
  let fabric: "Velvet" | "Cotton" | "Silk" | "Linen" = "Velvet";
  const mat = (raw.material || "").toLowerCase();
  if (mat.includes("silk")) fabric = "Silk";
  else if (mat.includes("cotton")) fabric = "Cotton";
  else if (mat.includes("linen")) fabric = "Linen";

  return {
    id: raw.id || "prod-1",
    slug: raw.slug || "maroon-velvet-embroidered-jacket",
    title: raw.title || "Handcrafted Atelier Ensemble",
    subtitle: raw.shortDescription || undefined,
    createdAt: raw.createdAt || undefined,
    price,
    compareAtPrice,
    description: raw.description || "Handcrafted made-to-order garment crafted by master artisans in Rajasthan.",
    details: [
      raw.material ? `${raw.material} fabric` : "Premium heavyweight velvet & silk",
      raw.embroidery ? `Intricate ${raw.embroidery} needlework` : "Intricate hand embroidery by master artisans",
      "Relaxed contemporary silhouette with structured tailoring",
      "Full sleeves with handcrafted cuffs and satin lining",
      "Exclusively made-to-order in Jaipur atelier",
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
    shippingInfo: "Complimentary worldwide express shipping on bespoke orders. Handcrafted delivery within 5-7 business days.",
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
