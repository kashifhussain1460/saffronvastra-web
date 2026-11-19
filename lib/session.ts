// Sign-in session as the API sees it. Shared by the middleware (edge) and the preview route (Node), so it uses fetch only.
import { API_ORIGIN } from "@/lib/site";

export const SESSION_COOKIE_NAME = "saffron_session";
export const ADMIN_ROLES = ["ADMIN"];

export type SessionCheck = { state: "valid" | "invalid-session" | "unavailable"; roles: string[] };

// The API owns sessions and roles, so callers ask it instead of trusting the cookie's presence
// (a cookie can outlive its session: expiry, sign-out elsewhere, a reset database).
export async function checkSession(sessionToken: string): Promise<SessionCheck> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/me`, {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
      cache: "no-store",
    });
    if (res.status === 401) return { state: "invalid-session", roles: [] };
    if (!res.ok) return { state: "unavailable", roles: [] };
    const body = await res.json();
    const roles: string[] = Array.isArray(body.data?.roles)
      ? body.data.roles
      : Array.isArray(body.data?.user?.roles)
      ? body.data.user.roles
      : [];
    return { state: "valid", roles };
  } catch {
    return { state: "unavailable", roles: [] };
  }
}

export const isAdmin = (session: SessionCheck) => session.state === "valid" && session.roles.some((r) => ADMIN_ROLES.includes(r));
