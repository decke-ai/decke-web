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
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const pageNumber = searchParams.get("page_number") || "0";
    const pageSize = searchParams.get("page_size") || "100";

    const queryParams = new URLSearchParams();
    queryParams.set("page_number", pageNumber);
    queryParams.set("page_size", pageSize);

    const url = `${API_URL}/organizations/${organizationId}/invites?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const url = `${API_URL}/organizations/${organizationId}/invites`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
