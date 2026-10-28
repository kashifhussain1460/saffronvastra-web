import { BRAND } from "@/lib/brand";
import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COLLECTIONS } from "@/data/collections";
import ShopPageTitle from "@/components/shop/ShopPageTitle";
import CollectionShop from "@/components/shop/CollectionShop";

// Collections and their products come from the live catalogue on every request.
export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:4000";
const SESSION_COOKIE_NAME = "saffron_session";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps) {
  const { slug } = await params;
  const res = await fetch(`${API_ORIGIN}/api/v1/collections/${encodeURIComponent(slug)}`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return { title: `Collection not found | ${BRAND.name}`, robots: { index: false, follow: true } };
  const data = (await res.json()).data;
  const description = (data.tagline || data.description || `Explore the ${data.title} collection: hand-embroidered pieces made to order in Jaipur.`).slice(0, 160);
  return {
    title: `${data.title} | ${BRAND.name}`,
    description,
    alternates: { canonical: `/collections/${data.slug}` },
    openGraph: { title: data.title, description, url: `/collections/${data.slug}`, ...(data.bannerImage ? { images: [{ url: data.bannerImage }] } : {}) },
  };
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  // The session is forwarded so an administrator can preview a Draft collection; visitors only get Active ones.
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const res = await fetch(`${API_ORIGIN}/api/v1/collections/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: session ? { Cookie: `${SESSION_COOKIE_NAME}=${session}` } : undefined,
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Collection service responded with ${res.status}`);
  const data = (await res.json()).data;

  // Editorial extras exist for the launch collections only; every other collection renders from its
  // stored title, tagline and image.
  const editorial = COLLECTIONS[slug];
  const title = data.title as string;
  const subtitle = (data.tagline || data.description || editorial?.subtitle || "") as string;
  const heroImage = (data.bannerImage || editorial?.heroImage || "/images/hero/collections_hero.jpg") as string;

  return (
    <div className="min-h-screen bg-canvas">
      <ShopPageTitle
        title={title}
        subtitle={subtitle || undefined}
        image={heroImage}
        crumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: title }]}
      />

      {editorial?.valueProps && editorial.valueProps.length > 0 && (
        <section className="border-b border-line">
          <ul className="mx-auto grid max-w-[1320px] grid-cols-2 gap-4 px-[15px] py-6 md:grid-cols-4">
            {editorial.valueProps.map((item) => (
              <li key={item.title} className="text-center text-sm font-medium text-ink">
                {item.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div id="collection-grid">
        <CollectionShop rawProducts={data.products ?? []} />
      </div>

      {editorial?.bottomBanner && (
        <section className="bg-inverse px-[15px] py-14 text-on-inverse">
          <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div className="max-w-xl space-y-2">
              <h2 className="text-3xl font-medium sm:text-4xl">{editorial.bottomBanner.title}</h2>
              <p className="text-sm leading-relaxed text-on-inverse-muted">{editorial.bottomBanner.description}</p>
            </div>
            <Link
              href={editorial.bottomBanner.href}
              className="inline-flex h-12 shrink-0 items-center rounded-full bg-surface px-8 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-primary-hover hover:text-on-primary"
            >
              {editorial.bottomBanner.cta}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
