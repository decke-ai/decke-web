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
    const { organization_id, user_id, onboarding } = body;

    if (!organization_id || !user_id) {
      return NextResponse.json(
        { error: "Organization ID and User ID are required" },
        { status: 400 }
      );
    }

    if (!onboarding) {
      return NextResponse.json(
        { error: "Onboarding data is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}/organizations/${organization_id}/users/${user_id}/onboardings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          goals: onboarding.goals || [],
          role: onboarding.role || null,
          experience_level: onboarding.experience_level || null,
          industry: onboarding.industry || [],
          icp: onboarding.icp || [],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend onboarding error:", response.status, errorText);
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding" },
      { status: 500 }
    );
  }
}
