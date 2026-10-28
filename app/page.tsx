import HeroBanners from "@/components/home/HeroBanners";
import CategoryTiles from "@/components/home/CategoryTiles";
import HomeCatalogue from "@/components/home/HomeCatalogue";
import JournalTeaser from "@/components/home/JournalTeaser";
import AnnouncementMarquee from "@/components/home/AnnouncementMarquee";
import NewsletterBanner from "@/components/marketing/NewsletterBanner";

// Home page in the Modave "home-jewelry-02" order. Each section lives in components/home and
// loads its own live data; sections with no data hide themselves.
export default function HomePage() {
  return (
    <div className="flex flex-col overflow-x-clip bg-canvas">
      <HeroBanners />
      <CategoryTiles />
      <HomeCatalogue />
      <JournalTeaser />
      <AnnouncementMarquee />
      <NewsletterBanner
        source="home"
        title="Join the Saffron Circle"
        description="Get early access to new collections, exclusive made-to-order releases, and intimate stories from our master artisans."
        className=""
      />
    </div>
  );
}
