import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BASE_OG, titleFor } from "@/lib/seo";

// Private alias of /account/wishlist. The 307 body carries the same title as the sign-in and account screens the
// visitor lands on ("Account"), so the server HTML and the browser agree. noindex matches the X-Robots-Tag header
// from next.config; openGraph has no url so the page does not inherit the home page's og:url.
export const metadata: Metadata = {
  title: "Account",
  openGraph: { ...BASE_OG, title: titleFor("Account") },
  robots: { index: false, follow: false },
};

export default function WishlistAliasPage() {
  redirect("/account/wishlist");
}
