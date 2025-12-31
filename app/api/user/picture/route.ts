import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("picture") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    let managementToken: string;
    try {
      managementToken = await getManagementApiToken();
    } catch (tokenError) {
      console.error("Failed to get management token:", tokenError);
      return NextResponse.json(
        { error: "Failed to authenticate with Auth0. Please check your Auth0 configuration." },
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
          user_metadata: {
            picture: dataUrl,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error("Auth0 update error:", JSON.stringify(errorData, null, 2));
      console.error("Status:", updateResponse.status);

      if (updateResponse.status === 403) {
        return NextResponse.json(
          { error: "Permission denied. Please configure Auth0 Management API permissions." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: errorData.message || "Failed to update profile picture" },
        { status: updateResponse.status }
      );
    }

    const updatedUser = await updateResponse.json();

    return NextResponse.json({
      success: true,
      picture: updatedUser.user_metadata?.picture || updatedUser.picture,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
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

  if (!issuerBaseUrl) {
    throw new Error("AUTH0_ISSUER_BASE_URL is not configured");
  }
  if (!clientId) {
    throw new Error("AUTH0_CLIENT_ID is not configured");
  }
  if (!clientSecret) {
    throw new Error("AUTH0_CLIENT_SECRET is not configured");
  }

  const tokenUrl = `${issuerBaseUrl}/oauth/token`;
  const audience = `${issuerBaseUrl}/api/v2/`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: audience,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Token request failed:", JSON.stringify(errorData, null, 2));
    console.error("Status:", response.status);
    throw new Error(`Failed to get management API token: ${errorData.error_description || errorData.error || response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}
