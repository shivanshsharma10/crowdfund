// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  signAdminToken,
  getTokenCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(email.trim(), password);
    if (!isValid) {
      // Generic message prevents user enumeration
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Use email as both subject and identifier for env-based admin
    const token = await signAdminToken(email.trim(), "admin");

    const cookieOpts = getTokenCookieOptions();
    const response = NextResponse.json({ success: true });
    response.cookies.set({ ...cookieOpts, value: token });
    return response;
  } catch (error) {
    console.error("[Login] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
