import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const tokenResult = await auth0.getAccessToken();
    console.log("=== AUTH0 SESSION ===");
    console.log("User:", JSON.stringify(session.user, null, 2));
    console.log("Access Token:", tokenResult.token);
    console.log("ID Token:", session.tokenSet?.idToken);
    console.log("=== END SESSION ===");

    return NextResponse.json({ user: session.user }, { status: 200 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
