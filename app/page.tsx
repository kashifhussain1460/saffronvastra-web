import { BRAND } from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";
import { API_ORIGIN } from "@/lib/site";
import { mapBackendProductToFrontend } from "@/lib/productMapper";
import HeroBanners from "@/components/home/HeroBanners";
import DynamicCollections from "@/components/home/DynamicCollections";
import HomeCatalogue from "@/components/home/HomeCatalogue";
import CraftsmanshipStory from "@/components/home/CraftsmanshipStory";
import WhyExplore from "@/components/home/WhyExplore";
import AnnouncementMarquee from "@/components/home/AnnouncementMarquee";
import NewsletterBanner from "@/components/marketing/NewsletterBanner";
import {
  HOME_PRODUCT_QUERIES,
  buildHomeCatalogue,
  toCollectionCategories,
  type CollectionCategory,
  type HomeCatalogueData,
} from "@/components/home/homeData";

// The home title is used as written (no template suffix); the image size is the file's real size.
export const metadata = buildMetadata({
  title: `${BRAND.displayName} | Suzani Embroidered Jackets & Kimonos`,
  description: `Explore ${BRAND.displayName}'s curated collection of Suzani embroidered jackets and kimonos, bringing distinctive traditional needlework into contemporary fashion.`,
  path: "/",
  images: [{ url: "/images/categories/suzani-stitchwork.jpg", width: 1200, height: 1500 }],
  absoluteTitle: true,
});

// Public catalogue reads for the server-rendered shelves and collection cards (anonymous, so only Active products).
// Any failure returns null and the component loads its data in the browser instead, as it did before.
async function getApiJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadHomeCatalogue(): Promise<HomeCatalogueData | undefined> {
  const bodies = await Promise.all(HOME_PRODUCT_QUERIES.map(getApiJson));
  if (bodies.some((body) => !Array.isArray(body?.items))) return undefined;
  const [bestsellers, newArrivals, featuredRaw, latest] = bodies.map((body) =>
    (body.items as any[]).map(mapBackendProductToFrontend)
  );
  return buildHomeCatalogue(bestsellers, newArrivals, featuredRaw, latest);
}

async function loadCollectionCategories(): Promise<CollectionCategory[] | undefined> {
  const body = await getApiJson("/api/v1/categories");
  return Array.isArray(body?.data) ? toCollectionCategories(body.data) : undefined;
}

export default async function HomePage() {
  const [catalogue, categories] = await Promise.all([loadHomeCatalogue(), loadCollectionCategories()]);

  return (
    <div className="flex flex-col overflow-x-clip bg-canvas">
      {/* 1. Premium Suzani Hero Banner */}
      <HeroBanners />

      {/* 2. Suzani Jackets and Suzani Kimonos Collection Showcase */}
      <DynamicCollections categories={categories} />

      {/* 3. Featured Suzani Products & Curated Shelves */}
      <HomeCatalogue initialData={catalogue} />

      {/* 4. Suzani Craftsmanship / Living Brand Story */}
      <CraftsmanshipStory />

      {/* 5. Why Explore Saffron Vastra */}
      <WhyExplore />

      {/* 6. Subtle Workshop Announcement Marquee */}
      <AnnouncementMarquee />

      {/* 8. Newsletter Subscription */}
      <NewsletterBanner
        source="home"
        title="Join the Saffron Circle"
        description="Receive updates on new Suzani releases, custom sizing options, and news on our jacket and kimono collections."
        className="mt-0 border-t border-line bg-[#FAF8F5]"
      />
    </div>
  );
}
