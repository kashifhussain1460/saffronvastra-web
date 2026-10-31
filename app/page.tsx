import type { Metadata } from "next";
import HeroBanners from "@/components/home/HeroBanners";
import DynamicCollections from "@/components/home/DynamicCollections";
import HomeCatalogue from "@/components/home/HomeCatalogue";
import CraftsmanshipStory from "@/components/home/CraftsmanshipStory";
import WhyExplore from "@/components/home/WhyExplore";
import JournalTeaser from "@/components/home/JournalTeaser";
import AnnouncementMarquee from "@/components/home/AnnouncementMarquee";
import NewsletterBanner from "@/components/marketing/NewsletterBanner";

export const metadata: Metadata = {
  title: "Saffron Vastra | Suzani Embroidered Jackets & Kimonos",
  description:
    "Explore Saffron Vastra's curated collection of Suzani embroidered jackets and kimonos, bringing distinctive traditional needlework into contemporary fashion.",
  openGraph: {
    title: "Saffron Vastra | Suzani Embroidered Jackets & Kimonos",
    description:
      "Explore Saffron Vastra's curated collection of Suzani embroidered jackets and kimonos, bringing distinctive traditional needlework into contemporary fashion.",
    images: [{ url: "/images/categories/suzani-stitchwork.jpg", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col overflow-x-clip bg-canvas">
      {/* 1. Premium Suzani Hero Banner */}
      <HeroBanners />

      {/* 2. Suzani Jackets and Suzani Kimonos Collection Showcase */}
      <DynamicCollections />

      {/* 3. Featured Suzani Products & Curated Shelves */}
      <HomeCatalogue />

      {/* 4. Suzani Craftsmanship / Living Brand Story */}
      <CraftsmanshipStory />

      {/* 5. Why Explore Saffron Vastra */}
      <WhyExplore />

      {/* 6. Editorial Fashion Journal Stories */}
      <JournalTeaser />

      {/* 7. Subtle Workshop Announcement Marquee */}
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
