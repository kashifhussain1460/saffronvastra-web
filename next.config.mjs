/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Client components (for example the breadcrumb structured data in PageTitle) read lib/site's SITE_URL in the
  // browser, where only NEXT_PUBLIC_* values exist; give them the same origin the server uses.
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  },
  images: {
    unoptimized: true,
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
