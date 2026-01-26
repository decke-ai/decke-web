import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session) {
      console.log("[Auth me] No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = await getAuthToken();

    const email = session.user.email;
    const domain = email?.split("@")[1];

    console.log("[Auth me] Email:", email, "Domain:", domain, "Has token:", !!token);

    if (!token) {
      console.log("[Auth me] No token found");
      return NextResponse.json({ exists: false, user: null, organization: null, subscription: null });
    }

    if (!domain) {
      console.log("[Auth me] No domain found");
      return NextResponse.json({ exists: false, user: null, organization: null, subscription: null });
    }

    const orgUrl = `${API_URL}/organizations?domain=${encodeURIComponent(domain)}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    const response = await fetch(orgUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return NextResponse.json({ exists: false, user: null, organization: null, subscription: null });
    }

    const data = await response.json();
    const organizations = data.content || data.items || [];

    if (organizations.length > 0) {
      const org = organizations[0];
      console.log("[Auth me] Organization data:", JSON.stringify(org));

      const usersUrl = `${API_URL}/organizations/${org.id}/users?email=${encodeURIComponent(email)}`;

      const usersResponse = await fetch(usersUrl, {
        method: "GET",
        headers,
      });

      let userData = null;
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.content || usersData.items || [];
        if (users.length > 0) {
          const user = users[0];
          userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            onboarding: user.onboarding,
            profile: user.profile || "Member",
          };
        } else {
          console.log(`No user found in backend for email: ${email}`);
        }
      } else {
        console.error(`User fetch failed for email ${email}:`, usersResponse.status);
      }

      let subscriptionData = null;

      if (org.subscription) {
        console.log("[Auth me] Using subscription from organization:", JSON.stringify(org.subscription));
        subscriptionData = {
          id: org.subscription.id,
          status: org.subscription.status,
          trial_start: org.subscription.trial_start,
          trial_end: org.subscription.trial_end,
          current_period_start: org.subscription.current_period_start,
          current_period_end: org.subscription.current_period_end,
        };
      } else {
        const subscriptionUrl = `${API_URL}/organizations/${org.id}/subscriptions`;
        const subscriptionResponse = await fetch(subscriptionUrl, {
          method: "GET",
          headers,
        });

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          console.log("[Auth me] Subscription response from endpoint:", JSON.stringify(subscription));
          if (subscription) {
            subscriptionData = {
              id: subscription.id,
              status: subscription.status,
              trial_start: subscription.trial_start,
              trial_end: subscription.trial_end,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
            };
          }
        } else {
          const errorText = await subscriptionResponse.text();
          console.error(`[Auth me] Subscription fetch failed for org ${org.id}:`, subscriptionResponse.status, errorText);
        }
      }

      const result = {
        exists: true,
        user: userData,
        organization: {
          id: org.id,
          name: org.name,
          domain: org.domain,
          logo: org.avatar,
        },
        subscription: subscriptionData,
      };
      console.log("[Auth me] Final result:", JSON.stringify(result));
      return NextResponse.json(result);
    }

    return NextResponse.json({ exists: false, user: null, organization: null, subscription: null });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
