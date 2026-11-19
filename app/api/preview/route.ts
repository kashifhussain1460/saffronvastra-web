// Preview mode for administrators: GET /api/preview?path=/products/<slug>
//
// Product and collection pages are cached at the edge (ISR), so they no longer read the sign-in cookie. An administrator
// who wants to see a Draft product, or an edit before the cache refreshes, opens the page through this route. It checks
// the session with the API and, for an administrator only, turns on Next.js draft mode for this browser, which makes
// those pages render live on every request and forward the session to the API. /api/preview/exit turns it off.
// The admin "View" buttons link here. /api/* is outside the middleware and disallowed in robots.txt.
import { draftMode, cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/safeRedirect";
import { checkSession, isAdmin, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const target = safeRedirectPath(request.nextUrl.searchParams.get("path"), "/");
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  // Not signed in: sign in first, then come back here.
  const toLogin = () => {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login, { headers: NO_STORE });
  };
  if (!token) return toLogin();

  const session = await checkSession(token);
  if (session.state === "invalid-session") return toLogin();
  if (session.state === "unavailable") {
    return new NextResponse("Preview is briefly unavailable. Please try again in a minute.", { status: 503, headers: { ...NO_STORE, "Retry-After": "30" } });
  }
  // A signed-in customer simply sees the public page.
  if (!isAdmin(session)) return NextResponse.redirect(new URL(target, request.url), { headers: NO_STORE });

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(target, request.url), { headers: NO_STORE });
}
