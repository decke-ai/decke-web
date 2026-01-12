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

    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("record_type");
    const pageNumber = searchParams.get("page_number") || "0";
    const pageSize = searchParams.get("page_size") || "20";
    const sortField = searchParams.get("sort_field") || "created_date";
    const sortDirection = searchParams.get("sort_direction") || "desc";

    const queryParams = new URLSearchParams();
    queryParams.set("page_number", pageNumber);
    queryParams.set("page_size", pageSize);
    queryParams.set("sort_field", sortField);
    queryParams.set("sort_direction", sortDirection);
    if (recordType) {
      queryParams.set("record_type", recordType);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/organizations/${organizationId}/records?${queryParams.toString()}`;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const token = await getAuthToken();
    const { organizationId } = await params;

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
