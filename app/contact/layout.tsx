import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import { infoPage } from "@/lib/jsonld";

// The contact page is a client component, so its metadata lives here. The description is the page's own subtitle.
const CONTACT_TITLE = "Contact Us";
const CONTACT_DESCRIPTION =
  "Our customer support team in Jaipur is available to assist with custom sizing, order updates, delivery questions, and styling advice.";

export const metadata: Metadata = buildMetadata({ title: CONTACT_TITLE, description: CONTACT_DESCRIPTION, path: "/contact" });

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={infoPage("ContactPage", "/contact", CONTACT_TITLE, CONTACT_DESCRIPTION)} />
      {children}
    </>
  );
}
