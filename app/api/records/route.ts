import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, getOrganizationId } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const organizationId = await getOrganizationId();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("record_type");
    const pageNumber = searchParams.get("page_number") || "0";
    const pageSize = searchParams.get("page_size") || "20";
    const sortField = searchParams.get("sort_field") || "created_date";
    const sortDirection = searchParams.get("sort_direction") || "desc";

    const params = new URLSearchParams();
    params.set("page_number", pageNumber);
    params.set("page_size", pageSize);
    params.set("sort_field", sortField);
    params.set("sort_direction", sortDirection);
    if (recordType) {
      params.set("record_type", recordType);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/organizations/${organizationId}/records?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

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
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();
    const organizationId = await getOrganizationId();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/organizations/${organizationId}/records`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}
