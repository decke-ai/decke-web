import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import { AUTOCOMPLETE_FIELD_TO_BACKEND_MAP, AutocompleteField } from "@/lib/explorium/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const field = searchParams.get("field") as AutocompleteField;
    const query = searchParams.get("query") || "";
    const semantic = searchParams.get("semantic") === "true";

    if (!field) {
      return NextResponse.json(
        { error: "Field parameter is required" },
        { status: 400 }
      );
    }

    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendField = AUTOCOMPLETE_FIELD_TO_BACKEND_MAP[field] || field;

    const backendParams = new URLSearchParams({
      field: backendField,
    });
    if (query) {
      backendParams.set("query", query);
    }
    if (semantic) {
      backendParams.set("semantic", "true");
    }

    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/providers/explorium/companies/autocompletes?${backendParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch autocomplete options" },
      { status: 500 }
    );
  }
}
