import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Failed to get authentication token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organization_name, organization_logo } = body;

    if (!organization_name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    const email = session.user.email;
    const domain = email?.split("@")[1];

    if (!domain) {
      return NextResponse.json(
        { error: "Invalid email domain" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/authentication/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        organization: {
          name: organization_name,
          domain: domain,
          avatar: organization_logo || null,
        },
        user: {
          name: null,
          avatar: session.user.picture || null,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend sign-up error:", response.status, errorText);
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Backend sign-up success:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "Failed to sign up" },
      { status: 500 }
    );
  }
}
