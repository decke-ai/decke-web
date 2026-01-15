import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = await getAuthToken();
    const email = session.user.email;
    const domain = email?.split("@")[1];

    if (!domain) {
      return NextResponse.json({ exists: false, user: null, organization: null });
    }

    const orgUrl = `${API_URL}/organizations?domain=${encodeURIComponent(domain)}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(orgUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      response = await fetch(orgUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return NextResponse.json({ exists: false, user: null, organization: null });
      }
    }

    const data = await response.json();
    const organizations = data.content || data.items || [];

    if (organizations.length > 0) {
      const org = organizations[0];

      const usersUrl = `${API_URL}/organizations/${org.id}/users?email=${encodeURIComponent(email)}`;
      let usersResponse = await fetch(usersUrl, {
        method: "GET",
        headers,
      });

      if (!usersResponse.ok) {
        usersResponse = await fetch(usersUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
      }

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
          };
        }
      }

      return NextResponse.json({
        exists: true,
        user: userData,
        organization: {
          id: org.id,
          name: org.name,
          domain: org.domain,
          logo: org.avatar,
        }
      });
    }

    return NextResponse.json({ exists: false, user: null, organization: null });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
