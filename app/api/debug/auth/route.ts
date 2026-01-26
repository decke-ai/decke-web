import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET() {
  const debug: Record<string, unknown> = {};

  try {
    const session = await auth0.getSession();
    debug.hasSession = !!session;
    debug.sessionEmail = session?.user?.email;

    const token = await getAuthToken();
    debug.hasToken = !!token;

    if (!session || !token) {
      return NextResponse.json(debug);
    }

    const email = session.user.email;
    const domain = email?.split("@")[1];
    debug.email = email;
    debug.domain = domain;

    const orgUrl = `${API_URL}/organizations?domain=${encodeURIComponent(domain || "")}`;
    debug.orgUrl = orgUrl;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    const response = await fetch(orgUrl, {
      method: "GET",
      headers,
    });

    debug.orgResponseStatus = response.status;
    debug.orgResponseOk = response.ok;

    if (!response.ok) {
      debug.orgResponseError = await response.text();
      return NextResponse.json(debug);
    }

    const data = await response.json();
    debug.orgResponseData = data;

    const organizations = data.content || data.items || [];
    debug.organizationsCount = organizations.length;

    if (organizations.length > 0) {
      const org = organizations[0];
      debug.organization = org;
      debug.orgHasSubscription = !!org.subscription;
      debug.orgSubscription = org.subscription;

      const subscriptionUrl = `${API_URL}/organizations/${org.id}/subscriptions`;
      const subscriptionResponse = await fetch(subscriptionUrl, {
        method: "GET",
        headers,
      });

      debug.subscriptionEndpointStatus = subscriptionResponse.status;
      debug.subscriptionEndpointOk = subscriptionResponse.ok;

      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();
        debug.subscriptionEndpointData = subscription;
      } else {
        debug.subscriptionEndpointError = await subscriptionResponse.text();
      }
    }

    return NextResponse.json(debug, { status: 200 });
  } catch (error) {
    debug.error = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(debug, { status: 500 });
  }
}
