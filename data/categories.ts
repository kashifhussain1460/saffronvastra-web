import { BRAND } from "@/lib/brand";
import { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "cat-1",
    slug: "jackets",
    name: "Jackets",
    productCount: 32,
    image: "/images/categories/jackets.jpg",
    description: "Hand-embroidered luxury velvet and silk jackets tailored for timeless elegance.",
  },
  {
    id: "cat-2",
    slug: "kimonos",
    name: "Kimonos",
    productCount: 18,
    image: "/images/categories/kimonos.jpg",
    description: "Flowing artisanal robes and wrap jackets adorned with intricate heritage needlework.",
  },
  {
    id: "cat-3",
    slug: "co-ord-sets",
    name: "Co-ord Sets",
    productCount: 12,
    image: "/images/categories/coords.jpg",
    description: "Harmonious two-piece ensembles blending contemporary cuts with traditional embroidery.",
  },
  {
    id: "cat-4",
    slug: "tops",
    name: "Tops",
    productCount: 16,
    image: "/images/products/beige_kimono.jpg",
    description: "Delicate embroidered tops and blouses designed for versatile luxury layering.",
  },
  {
    id: "cat-5",
    slug: "new-arrivals",
    name: "New Arrivals",
    productCount: 10,
    image: "/images/categories/new_arrivals.jpg",
    description: `The latest handcrafted releases from the ${BRAND.name} atelier.`,
  },
];
