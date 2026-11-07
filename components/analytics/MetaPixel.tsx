"use client";

import { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Admin screens are never reported to Meta (their URLs and usage are internal).
const isTracked = (pathname: string | null) => !!pathname && !pathname.startsWith("/admin");

// The base code's fbq('track','PageView') covers the first page; client-side navigations in the App Router don't
// reload the page, so each later route change sends its own PageView.
function RouteChangePageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    const fullPath = qs ? `${pathname}?${qs}` : pathname;
    const previous = lastPath.current;
    lastPath.current = fullPath;
    // First page is tracked by the base code; admin pages are never tracked. window.fbq only exists once the
    // base code has run, so the first storefront page after an admin page isn't double-counted.
    if (previous === null || previous === fullPath || !isTracked(pathname)) return;
    window.fbq?.("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  // Pixel IDs are numeric; anything else is a misconfiguration and must not be injected into the script.
  if (!/^\d+$/.test(pixelId)) return null;

  return (
    <>
      <Suspense fallback={null}>
        <RouteChangePageViews />
      </Suspense>
      {isTracked(pathname) && <PixelBaseCode pixelId={pixelId} />}
    </>
  );
}

function PixelBaseCode({ pixelId }: { pixelId: string }) {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
