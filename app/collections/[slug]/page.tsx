import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COLLECTIONS } from "@/data/collections";
import ShopPageTitle from "@/components/shop/ShopPageTitle";
import CollectionShop from "@/components/shop/CollectionShop";
import { API_ORIGIN } from "@/lib/site";
import { buildMetadata, notFoundMetadata, truncateAtWord } from "@/lib/seo";
import { breadcrumbList } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";

// Collections and their products come from the live catalogue on every request.
// There is deliberately no loading.tsx for this route or for /collections: a loading boundary lets the response start
// (status 200) before the collection is fetched, so a missing collection would be a soft 404 and the metadata would
// stream into <body>.
export const dynamic = "force-dynamic";

const SESSION_COOKIE_NAME = "saffron_session";
const DEFAULT_HERO_IMAGE = "/images/hero/collections_hero.jpg";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

// One API call per request, shared by the page and its metadata. null means the collection does not exist
// or is not public; any other failure is thrown.
// The session is forwarded so an administrator can preview a Draft collection; visitors only get Active ones.
const loadCollection = cache(async (slug: string) => {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const res = await fetch(`${API_ORIGIN}/api/v1/collections/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: session ? { Cookie: `${SESSION_COOKIE_NAME}=${session}` } : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Collection service responded with ${res.status}`);
  return (await res.json()).data;
});

// The hero image the page shows: the stored banner, then the editorial image, then the shared collections hero.
const heroImageFor = (slug: string, data: any) =>
  (data.bannerImage || COLLECTIONS[slug]?.heroImage || DEFAULT_HERO_IMAGE) as string;

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  // a failed request is thrown (the page answers with the error page), never reported as "not found"
  const data = await loadCollection(slug);
  // explicit values so the /collections canonical and Open Graph from the parent layouts are not inherited, with the
  // same title as the 404 page itself so the server HTML and the browser agree (see notFoundMetadata).
  if (!data) return notFoundMetadata();
  const title = data.title as string;
  const description = truncateAtWord(
    data.tagline || data.description || `Explore the ${title} collection: hand-embroidered pieces made to order in Jaipur.`,
    155
  );
  return buildMetadata({
    title,
    description,
    path: `/collections/${data.slug}`,
    images: [{ url: heroImageFor(slug, data), alt: title }],
    // a Draft collection previewed by an administrator must never be indexed
    noindex: data.status !== "Active",
  });
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  const data = await loadCollection(slug);
  if (!data) notFound();

  // Editorial extras exist for the launch collections only; every other collection renders from its
  // stored title, tagline and image.
  const editorial = COLLECTIONS[slug];
  const title = data.title as string;
  const subtitle = (data.tagline || data.description || editorial?.subtitle || "") as string;
  const heroImage = heroImageFor(slug, data);
  const crumbs = [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: title }];

  return (
    <>
      {/* structured data for public collections only, never for a Draft previewed by an administrator */}
      {data.status === "Active" && <JsonLd data={breadcrumbList(crumbs.map((c) => ({ name: c.label, path: c.href })))} />}
      <div className="min-h-screen bg-canvas">
        <ShopPageTitle title={title} subtitle={subtitle || undefined} image={heroImage} crumbs={crumbs} />

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
    </>
  );
}
