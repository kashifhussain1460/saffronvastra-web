import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// The contact page is a client component, so its metadata lives here. The description is the page's own subtitle.
export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Our customer support team in Jaipur is available to assist with custom sizing, order updates, delivery questions, and styling advice.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
