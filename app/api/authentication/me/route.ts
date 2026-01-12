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

    console.log("=== /api/authentication/me ===");
    console.log("Email:", email);
    console.log("Domain:", domain);
    console.log("Token exists:", !!token);
    console.log("API_URL:", API_URL);

    const orgUrl = `${API_URL}/organizations?domain=${encodeURIComponent(domain)}`;
    console.log("Fetching:", orgUrl);

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

    console.log("Organizations response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Organizations error (with token):", errorText);

      console.log("Retrying without token...");
      response = await fetch(orgUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      console.log("Organizations response status (no token):", response.status);

      if (!response.ok) {
        const errorText2 = await response.text();
        console.log("Organizations error (no token):", errorText2);
        return NextResponse.json({ exists: false, user: null, organization: null });
      }
    }

    const data = await response.json();
    console.log("Organizations response data:", JSON.stringify(data, null, 2));

    const organizations = data.content || data.items || [];
    console.log("Organizations found:", organizations.length);

    if (organizations.length > 0) {
      const org = organizations[0];
      console.log("Organization:", org.id, org.name);

      const usersUrl = `${API_URL}/organizations/${org.id}/users?email=${encodeURIComponent(email)}`;
      let usersResponse = await fetch(usersUrl, {
        method: "GET",
        headers,
      });

      console.log("Users response status:", usersResponse.status);

      if (!usersResponse.ok) {
        const errorText = await usersResponse.text();
        console.log("Users error (with token):", errorText);

        console.log("Retrying users without token...");
        usersResponse = await fetch(usersUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        console.log("Users response status (no token):", usersResponse.status);
      }

      let userData = null;
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.content || usersData.items || [];
        console.log("Users found:", users.length);
        if (users.length > 0) {
          const user = users[0];
          console.log("User:", user.id, "onboarding:", user.onboarding);
          userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            onboarding: user.onboarding,
          };
        }
      } else {
        const errorText = await usersResponse.text();
        console.log("Users error (final):", errorText);
      }

      const result = {
        exists: true,
        user: userData,
        organization: {
          id: org.id,
          name: org.name,
          domain: org.domain,
          logo: org.avatar,
        }
      };
      console.log("=== Returning SUCCESS ===", JSON.stringify(result, null, 2));
      return NextResponse.json(result);
    }

    console.log("=== Returning NO ORG FOUND ===");
    return NextResponse.json({ exists: false, user: null, organization: null });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
