import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  try {
    const response = await auth0.middleware(request);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
