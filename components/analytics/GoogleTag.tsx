"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

// Admin screens are never reported to Google (their URLs and usage are internal).
const isTracked = (pathname: string | null) => !!pathname && !pathname.startsWith("/admin");

interface GoogleTagProps {
  // Google tag ID from the GA4 web data stream (GTM-…/GT-…/G-…). It already carries the GA4 destination and
  // enhanced measurement, so the tag is loaded once and no separate gtag('config') is sent.
  tagId: string;
  // Hostnames the tag may run on (the live shop). Anywhere else — localhost, previews — nothing loads.
  hosts: string[];
}

// The one Google tag for the whole site. It sets Google Consent Mode v2 defaults from the visitor's stored choice
// before the tag loads (everything denied until they choose), then loads the tag without blocking rendering.
// page_view (including client-side navigations), session_start, user_engagement and site search come from GA4's
// enhanced measurement; the e-commerce events are sent with lib/gtag.ts.
export default function GoogleTag({ tagId, hosts }: GoogleTagProps) {
  const pathname = usePathname();
  // IDs are letters, digits and dashes only; anything else is a misconfiguration and must not be injected.
  if (!/^(GTM|GT|G)-[A-Z0-9]+$/.test(tagId) || !isTracked(pathname)) return null;
  const allowedHosts = JSON.stringify(hosts.filter((h) => /^[a-z0-9.-]+$/i.test(h)));

  return (
    <Script id="google-tag" strategy="afterInteractive">
      {`(function(){
if (${allowedHosts}.indexOf(location.hostname) === -1 || window.__svGoogleTag) return;
window.__svGoogleTag = true;
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
var c = null;
try { c = JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}') || 'null'); } catch (e) {}
var a = c && c.analytics === true ? 'granted' : 'denied';
var m = c && c.marketing === true ? 'granted' : 'denied';
gtag('consent', 'default', { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m,
  functionality_storage: 'granted', security_storage: 'granted' });
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
var s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtm.js?id=${tagId}';
document.head.appendChild(s);
})();`}
    </Script>
  );
}
