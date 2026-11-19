/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Cached (ISR) pages such as product pages are rebuilt in the background at most once a minute. A CDN may hand a
  // stale copy to the first visitor after that while it rebuilds; this caps how old that copy can be at one hour
  // (Next's default is a year), so a price or availability change never lingers for a rarely visited product.
  expireTime: 3600,
  // Client components (for example the breadcrumb structured data in PageTitle) read lib/site's SITE_URL in the
  // browser, where only NEXT_PUBLIC_* values exist; give them the same origin the server uses.
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  },
  // Product photos are stored at full camera size (often 1.5 MB+), so every <Image> goes through the optimizer:
  // resized to the rendered width and served as AVIF/WebP. Only these hosts may be optimized.
  images: {
    formats: ["image/avif", "image/webp"],
    // optimized variants are cached for 31 days; a changed photo gets a new upload URL anyway
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // Vercel Blob (media library uploads)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      // a few products still use the Etsy listing photos
      { protocol: "https", hostname: "i.etsystatic.com", pathname: "/**" },
    ],
  },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    ];
    // Private areas must never be indexed, even if a link to them leaks.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    // Browsers keep files from public/images and public/videos for 30 days, so a changed file needs a new name.
    const staticMedia = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }];
    return [
      { source: "/:path*", headers: security },
      { source: "/images/:path*", headers: staticMedia },
      { source: "/videos/:path*", headers: staticMedia },
      ...["/admin/:path*", "/admin", "/account/:path*", "/account", "/auth/:path*", "/checkout", "/cart", "/order-confirmation", "/wishlist"].map(
        (source) => ({ source, headers: noindex })
      ),
    ];
  },
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN || "http://127.0.0.1:4000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${apiOrigin}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
