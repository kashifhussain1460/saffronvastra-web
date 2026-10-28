import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Track Your Order | ${BRAND.name}`,
  description: "Look up your order with the order number and the email address used at checkout.",
  // an order lookup is a utility page, not something to list in search results
  robots: { index: false, follow: true },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
