// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback_dev_secret_change_in_production"
);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPublicAdminRoute = createRouteMatcher(["/admin/login"]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // ── Admin routes: use existing JWT auth (unchanged) ───────────
  if (isAdminRoute(request)) {
    if (isPublicAdminRoute(request)) return NextResponse.next();

    const token =
      request.cookies.get("admin_token")?.value ??
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return redirectToAdminLogin(request);

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ["HS256"],
      });
      if (payload.role !== "ADMIN") return redirectToAdminLogin(request);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", String(payload.sub ?? ""));
      requestHeaders.set("x-user-email", String(payload.email ?? ""));
      requestHeaders.set("x-user-role", String(payload.role ?? ""));
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      const response = redirectToAdminLogin(request);
      response.cookies.delete("admin_token");
      return response;
    }
  }

  // ── Donate API: require Clerk auth ────────────────────────────
  if (pathname.startsWith("/api/donate/checkout")) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  // ── Dashboard: require Clerk auth ─────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

function redirectToAdminLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};