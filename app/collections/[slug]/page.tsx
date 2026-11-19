import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies, draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { COLLECTIONS } from "@/data/collections";
import ShopPageTitle from "@/components/shop/ShopPageTitle";
import CollectionShop from "@/components/shop/CollectionShop";
import PreviewBanner from "@/components/layout/PreviewBanner";
import { API_ORIGIN } from "@/lib/site";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { buildMetadata, notFoundMetadata, truncateAtWord } from "@/lib/seo";
import { breadcrumbList } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";

// Incremental static regeneration, as for product pages: rendered on the first visit, served from the edge cache and
// rebuilt at most once a minute. Administrators see Draft collections through preview mode (app/api/preview).
// There is deliberately no loading.tsx for this route or for /collections: a loading boundary lets the response start
// (status 200) before the collection is fetched, so a missing collection would be a soft 404 and the metadata would
// stream into <body>.
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

const DEFAULT_HERO_IMAGE = "/images/hero/collections_hero.jpg";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

// One API call per request, shared by the page and its metadata. null means the collection does not exist
// or is not public; any other failure is thrown.
// Only in preview mode is the administrator's session forwarded, so a Draft collection can be shown to them;
// every cached render is anonymous and gets Active collections only.
const loadCollection = cache(async (slug: string) => {
  const { isEnabled: preview } = await draftMode();
  const session = preview ? (await cookies()).get(SESSION_COOKIE_NAME)?.value : undefined;
  const res = await fetch(
    `${API_ORIGIN}/api/v1/collections/${encodeURIComponent(slug)}`,
    session
      ? { cache: "no-store", headers: { Cookie: `${SESSION_COOKIE_NAME}=${session}` } }
      : { next: { revalidate: 60 } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Collection service responded with ${res.status}`);
  return { data: (await res.json()).data, preview };
});

// Outside preview mode the API only returns public collections; in preview mode a Draft must never be indexed.
const isPublic = (data: any, preview: boolean) => !preview || data.status === "Active";

// The hero image the page shows: the stored banner, then the editorial image, then the shared collections hero.
const heroImageFor = (slug: string, data: any) =>
  (data.bannerImage || COLLECTIONS[slug]?.heroImage || DEFAULT_HERO_IMAGE) as string;

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  // a failed request is thrown (the page answers with the error page), never reported as "not found"
  const loaded = await loadCollection(slug);
  // explicit values so the /collections canonical and Open Graph from the parent layouts are not inherited, with the
  // same title as the 404 page itself so the server HTML and the browser agree (see notFoundMetadata).
  if (!loaded) return notFoundMetadata();
  const { data, preview } = loaded;
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
    noindex: !isPublic(data, preview),
  });
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  const loaded = await loadCollection(slug);
  if (!loaded) notFound();
  const { data, preview } = loaded;

  // Editorial extras exist for the launch collections only; every other collection renders from its
  // stored title, tagline and image.
  const editorial = COLLECTIONS[slug];
  const title = data.title as string;
  const subtitle = (data.tagline || data.description || editorial?.subtitle || "") as string;
  const heroImage = heroImageFor(slug, data);
  const crumbs = [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: title }];

  return (
    <>
      {preview && <PreviewBanner path={`/collections/${data.slug}`} status={data.status} />}
      {/* structured data for public collections only, never for a Draft previewed by an administrator */}
      {isPublic(data, preview) && <JsonLd data={breadcrumbList(crumbs.map((c) => ({ name: c.label, path: c.href })))} />}
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
