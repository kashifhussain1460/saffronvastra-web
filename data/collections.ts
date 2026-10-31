export interface CollectionConfig {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string;
  traditionCallout: {
    title: string;
    description: string;
  };
  valueProps: {
    title: string;
    description?: string;
  }[];
  editorialPromo: {
    title: string;
    description: string;
    cta: string;
    image: string;
    href: string;
  };
  bottomBanner: {
    title: string;
    description: string;
    cta: string;
    href: string;
  };
  categoryMatch: string[];
  fabricMatch?: string[];
}

export const COLLECTIONS: Record<string, CollectionConfig> = {
  "velvet-jackets": {
    slug: "velvet-jackets",
    eyebrow: "THE VELVET EDIT",
    title: "Velvet Jackets",
    subtitle:
      "Rich textures, intricate embroidery and timeless silhouettes. Crafted for stories that last beyond seasons.",
    heroImage: "/images/hero/velvet_hero_model.jpg",
    traditionCallout: {
      title: "Tradition in Every Thread",
      description: "Luxury velvet jackets hand-embroidered by skilled artisans in Jaipur.",
    },
    valueProps: [
      { title: "PREMIUM VELVET FABRICS" },
      { title: "HAND EMBROIDERED" },
      { title: "LIMITED PIECES" },
      { title: "TIMELESS DESIGNS" },
    ],
    editorialPromo: {
      title: "More Than Fashion",
      description:
        "A celebration of heritage, craft by skilled hands, and modern living.",
      cta: "Our Story",
      image: "/images/editorial/velvet_story_tile.jpg",
      href: "/about",
    },
    bottomBanner: {
      title: "Handcrafted Pieces Made to Last",
      description:
        "Handcrafted in small batches, designed to be worn, loved, and passed on.",
      cta: "Explore More",
      href: "/collections",
    },
    categoryMatch: ["jackets"],
    fabricMatch: ["Velvet"],
  },
  "timeless-kimonos": {
    slug: "timeless-kimonos",
    eyebrow: "FLOWING SILHOUETTES",
    title: "Timeless Kimonos",
    subtitle:
      "Graceful silhouettes meeting intricate zardozi and thread embroidery. Light layers designed for day-to-night elegance.",
    heroImage: "/images/categories/kimonos.jpg",
    traditionCallout: {
      title: "Elegance",
      description: "Fluid wraps and kimono robes hand-stitched with mindful precision.",
    },
    valueProps: [
      { title: "PURE SILK & COTTON" },
      { title: "HERITAGE NEEDLEWORK" },
      { title: "MADE TO ORDER" },
      { title: "SEASONLESS CUTS" },
    ],
    editorialPromo: {
      title: "Wearable Poetry",
      description:
        "Each kimono captures Rajasthan's centuries-old needlecraft in a flowing modern cut.",
      cta: "Our Story",
      image: "/images/editorial/artisan_embroidery.jpg",
      href: "/about",
    },
    bottomBanner: {
      title: "Handcrafted For Everyday Elegance",
      description:
        "Custom tailored to your measurements with conscious care and premium fabrics.",
      cta: "Discover More",
      href: "/collections",
    },
    categoryMatch: ["kimonos"],
  },
  "autumn-edit": {
    slug: "autumn-edit",
    eyebrow: "SEASONAL EDIT",
    title: "Autumn 2026",
    subtitle:
      "Rich textures, earthy tones, and handcrafted details made for slower, more meaningful days.",
    heroImage: "/images/editorial/autumn_lookbook.jpg",
    traditionCallout: {
      title: "Earthy Textures",
      description: "Co-ord sets, tailored jackets, and tops in warm autumn terracotta and olive.",
    },
    valueProps: [
      { title: "NATURAL TEXTILES" },
      { title: "EARTH PALETTES" },
      { title: "LIMITED PRODUCTION" },
      { title: "SLOW CRAFT" },
    ],
    editorialPromo: {
      title: "Slower Days",
      description: "Garments that invite pause, presence, and appreciation for handmade artistry.",
      cta: "Lookbook",
      image: "/images/hero/hero_model.jpg",
      href: "/about",
    },
    bottomBanner: {
      title: "Pieces That Stay With You",
      description:
        "Every garment is crafted to order with sustainable pride and zero warehouse waste.",
      cta: "Shop All",
      href: "/collections",
    },
    categoryMatch: ["jackets", "co-ord-sets", "tops"],
  },
};
