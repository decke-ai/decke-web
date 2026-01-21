import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const token = await getAuthToken();
    const { organizationId } = await params;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const subscriptionUrl = `${API_URL}/organizations/${organizationId}/subscriptions`;
    const subscriptionResponse = await fetch(subscriptionUrl, {
      method: "GET",
      headers,
    });

    if (!subscriptionResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: subscriptionResponse.status }
      );
    }

    const subscription = await subscriptionResponse.json();

    let plan = null;
    if (subscription?.plan_id) {
      const planUrl = `${API_URL}/plans/${subscription.plan_id}`;
      const planResponse = await fetch(planUrl, {
        method: "GET",
        headers,
      });

      if (planResponse.ok) {
        plan = await planResponse.json();
      }
    }

    return NextResponse.json({
      subscription,
      plan,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}
