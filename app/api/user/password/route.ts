import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
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
          password: newPassword,
          connection: "Username-Password-Authentication",
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error("Auth0 password update error:", JSON.stringify(errorData, null, 2));

      if (errorData.message?.includes("PasswordStrengthError")) {
        return NextResponse.json(
          { error: "Password does not meet strength requirements. Include uppercase, lowercase, numbers, and special characters." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: errorData.message || "Failed to update password" },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
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
