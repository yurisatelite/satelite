import type { NextRequest } from "next/server";

// Must match AUTH_COOKIE_KEY in src/lib/supabase.ts and middleware.ts
const AUTH_COOKIE_KEY = "sb-auth-token";

export type AuthInfo = { accessToken: string; userId: string; email?: string };

export function extractAuth(request: NextRequest): AuthInfo | null {
  const raw = request.cookies.get(AUTH_COOKIE_KEY)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(decodeURIComponent(raw));
    const accessToken = session?.access_token;
    if (!accessToken) return null;
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64").toString("utf8")
    );
    return { accessToken, userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
