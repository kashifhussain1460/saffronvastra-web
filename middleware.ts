import { BRAND } from "@/lib/brand";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/safeRedirect";
import { SITE_URL } from "@/lib/site";
import { ADMIN_ROLES, checkSession, SESSION_COOKIE_NAME } from "@/lib/session";

export { SESSION_COOKIE_NAME };

// Branded, self-contained page for when the API cannot confirm the session (it has no app chrome to rely on).
function serviceUnavailable() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><title>Back shortly | ${BRAND.name}</title></head>
<body style="margin:0;background:#FFFFFF;color:#181818;font-family:'Kumbh Sans',system-ui,-apple-system,sans-serif"><main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
<div style="max-width:460px;text-align:center"><p style="letter-spacing:2px;text-transform:uppercase;font-size:12px;font-weight:600;color:#181818">${BRAND.name}</p>
<h1 style="font-weight:500;font-size:32px;margin:12px 0;letter-spacing:0">We will be back shortly</h1>
<p style="color:#4D4E4F;line-height:1.6">Your account area is briefly unavailable. Please try again in a minute. Browsing the shop still works.</p>
<p style="margin-top:20px"><a href="" style="display:inline-block;padding:13px 30px;background:#181818;color:#fff;border-radius:28px;text-decoration:none;font-size:14px;font-weight:600">Try again</a>
&nbsp; <a href="/" style="color:#C92424;font-size:14px;font-weight:600">Go to the shop</a></p></div></main></body></html>`;
  return new NextResponse(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "30" } });
}

/**
 * Next.js Edge Routing Middleware
 * 0. Production on a *.vercel.app address: permanent redirect to the same path on the public origin (SITE_URL).
 * Guards authenticated vs guest routes at the network edge:
 * 1. Authenticated routes (/account/*, /admin/*): Unauthenticated requests are redirected to /auth/login with a redirect query param.
 * 2. Guest-only routes (/auth/login, /auth/register): Authenticated requests are redirected to /account or intended destination.
 * 3. Public routes (/, /collections/*, /products/*, /cart, /checkout, etc.): Open to all patrons and guests.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 0. The production deployment also answers on its *.vercel.app addresses. Those copies of the shop would be crawled
  // and split links with www, so every page there moves permanently to the same path on the public origin.
  // Previews (VERCEL_ENV=preview) keep their own address.
  const host = (request.headers.get("host") || request.nextUrl.host).toLowerCase();
  // Only towards a real public origin: never to localhost (SITE_URL unset) or back to another vercel.app address.
  const publicOrigin = SITE_URL.startsWith("https://") && !SITE_URL.includes(".vercel.app");
  if (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app") && publicOrigin) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, SITE_URL), 308);
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isAccountRoute = pathname === "/account" || pathname.startsWith("/account/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthRoute =
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname === "/auth/forgot-password";

  // 1. Enforce Authenticated Routes
  if (isAccountRoute || isAdminRoute) {
    if (!sessionToken || sessionToken.trim() === "") {
      const loginUrl = new URL("/auth/login", request.url);
      const destination = pathname + (search || "");
      loginUrl.searchParams.set("redirect", destination);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 1b. A cookie alone is not a session: account and admin pages (and the sign-in forms) check it against the API.
  if ((isAccountRoute || isAdminRoute || isAuthRoute) && sessionToken) {
    const session = await checkSession(sessionToken);

    if (session.state === "invalid-session") {
      // Drop the stale cookie so nothing bounces between /auth/login and a protected page.
      const response = isAuthRoute
        ? NextResponse.next()
        : (() => {
            const loginUrl = new URL("/auth/login", request.url);
            loginUrl.searchParams.set("redirect", pathname + (search || ""));
            return NextResponse.redirect(loginUrl);
          })();
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    if (session.state === "unavailable" && !isAuthRoute) {
      return serviceUnavailable();
    }
    if (isAdminRoute && session.state === "valid" && !session.roles.some((r) => ADMIN_ROLES.includes(r))) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
    if (isAuthRoute && session.state === "valid") {
      // 2. Signed-in patrons do not need the sign-in forms again.
      const rawRedirect = request.nextUrl.searchParams.get("redirect");
      const safeDestination = safeRedirectPath(rawRedirect, "/account");
      return NextResponse.redirect(new URL(safeDestination, request.url));
    }
  }

  // 3. Allow Next.js to proceed for all public storefront and content routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static build files)
     * - _next/image (Next.js image optimization)
     * - favicon.ico, icons, static assets (.svg, .png, .jpg, .webp, .ico)
     * - api routes (/api/*)
     * - health probes (/health/*)
     * - binary uploads (/uploads/*)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|icons|api|health|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
