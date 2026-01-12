import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
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

    console.log("=== check-domain ===");
    console.log("Domain:", domain);
    console.log("Token exists:", !!token);

    const response = await fetch(
      `${API_URL}/organizations?domain=${encodeURIComponent(domain)}`,
      {
        method: "GET",
        headers,
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error:", errorText);
      return NextResponse.json({ exists: false, organization: null });
    }

    const data = await response.json();
    console.log("Organizations found:", data.items?.length || 0);

    if (data.items && data.items.length > 0) {
      console.log("Organization exists:", data.items[0].id);
      return NextResponse.json({ exists: true, organization: data.items[0] });
    }

    console.log("No organization found");
    return NextResponse.json({ exists: false, organization: null });
  } catch (error) {
    console.error("Check domain error:", error);
    return NextResponse.json({ exists: false, organization: null });
  }
}
