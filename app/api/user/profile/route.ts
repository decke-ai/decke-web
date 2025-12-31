import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let managementToken: string;
    try {
      managementToken = await getManagementApiToken();
    } catch (tokenError) {
      console.error("Failed to get management token:", tokenError);
      return NextResponse.json(
        { error: "Failed to authenticate with Auth0" },
        { status: 500 }
      );
    }

    const userId = session.user.sub;

    const updateResponse = await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${managementToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          user_metadata: {
            phone: phone || "",
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error("Auth0 update error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        { error: errorData.message || "Failed to update profile" },
        { status: updateResponse.status }
      );
    }

    const updatedUser = await updateResponse.json();

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.user_metadata?.phone,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function getManagementApiToken(): Promise<string> {
  const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  if (!issuerBaseUrl || !clientId || !clientSecret) {
    throw new Error("Auth0 configuration is incomplete");
  }

  const response = await fetch(`${issuerBaseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `${issuerBaseUrl}/api/v2/`,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || "Failed to get management API token");
  }

  const data = await response.json();
  return data.access_token;
}
