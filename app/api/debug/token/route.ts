import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const tokenResult = await auth0.getAccessToken();
    const token = tokenResult?.token;

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

    return NextResponse.json({
      token: token.substring(0, 50) + "...",
      payload,
      iss: payload.iss,
      aud: payload.aud,
      sub: payload.sub,
      exp: payload.exp,
      expDate: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get token", details: String(error) },
      { status: 500 }
    );
  }
}
