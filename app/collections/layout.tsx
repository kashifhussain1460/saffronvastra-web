import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Shop the Collection | ${BRAND.name}`,
  description: "Hand-embroidered velvet and cotton jackets, made to order by artisans in Jaipur. Browse every piece and filter by category, size and price.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
