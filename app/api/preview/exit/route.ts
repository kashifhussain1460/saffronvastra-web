// Leaves preview mode (see ../route.ts): GET /api/preview/exit?path=/products/<slug> returns to the cached public page.
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/safeRedirect";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const target = safeRedirectPath(request.nextUrl.searchParams.get("path"), "/");
  return NextResponse.redirect(new URL(target, request.url), { headers: { "Cache-Control": "no-store" } });
}
