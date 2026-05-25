// src/lib/auth.ts
// Lightweight JWT-based auth utilities (no NextAuth overhead)

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback_dev_secret_change_in_production"
);

const COOKIE_NAME = "admin_token";
const TOKEN_EXPIRY = "8h";

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: "ADMIN";
  iat?: number;
  exp?: number;
}

// ── Sign a new JWT ─────────────────────────────────────────────
export async function signAdminToken(email: string, userId: string): Promise<string> {
  return new SignJWT({ email, role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// ── Verify a JWT string ────────────────────────────────────────
export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

// ── Read token from the current request cookies (Server Components) ─
export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// ── Cookie helpers ─────────────────────────────────────────────
export function getTokenCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours in seconds
  };
}

// ── Validate env-based admin credentials ──────────────────────
export function validateAdminCredentials(
  email: string,
  password: string
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("[Auth] ADMIN_EMAIL or ADMIN_PASSWORD is not set");
    return false;
  }

  return email === adminEmail && password === adminPassword;
}
