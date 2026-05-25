// src/middleware.ts
// Edge Middleware — protects all /admin/* routes except /admin/login

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback_dev_secret_change_in_production"
);

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /admin/* routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow public admin paths (login page) through without auth
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Token extraction ─────────────────────────────────────────
  const token =
    request.cookies.get("admin_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return redirectToLogin(request);
  }

  // ── Token verification ───────────────────────────────────────
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Enforce ADMIN role
    if (payload.role !== "ADMIN") {
      return redirectToLogin(request);
    }

    // Attach identity headers for downstream route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.sub ?? ""));
    requestHeaders.set("x-user-email", String(payload.email ?? ""));
    requestHeaders.set("x-user-role", String(payload.role ?? ""));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Expired, malformed, or tampered token
    const response = redirectToLogin(request);
    response.cookies.delete("admin_token");
    return response;
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Match all /admin routes; exclude static assets and API internals
  matcher: ["/admin/:path*"],
};
