// Small helper for the admin screens: one call, one result, one readable message.
export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  body: T | null;
  message: string;
}

export async function api<T = any>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init;
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const body = (await res.json().catch(() => null)) as any;
    const message = res.ok
      ? body?.message || ""
      : body?.message || body?.errors?.[0]?.message || `The request failed (HTTP ${res.status}).`;
    return { ok: res.ok, status: res.status, body, message };
  } catch {
    return { ok: false, status: 0, body: null, message: "Network error. Please check your connection and try again." };
  }
}

export const formatDateTime = (value: string | Date | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

export const formatDay = (value: string | Date | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
