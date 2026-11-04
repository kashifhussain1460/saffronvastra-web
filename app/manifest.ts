import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { BACKGROUND_COLOR, THEME_COLOR } from "@/lib/seo";

// Web app manifest (/manifest.webmanifest). Icons are the existing app/icon.png (512x512) and app/apple-icon.png (180x180).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    start_url: "/",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
