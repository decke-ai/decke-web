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

    const body = await request.json();
    const { organization_id } = body;

    if (!organization_id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const token = await getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/organizations/${organization_id}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: session.user.name || session.user.email?.split("@")[0],
        email: session.user.email,
        avatar: session.user.picture,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Create user error:", errorText);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: response.status }
      );
    }

    const userData = await response.json();
    return NextResponse.json({ user_id: userData.id });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
