import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; listId: string }> }
) {
  try {
    const token = await getAuthToken();
    const { organizationId, listId } = await params;

    const { searchParams } = new URL(request.url);
    const pageNumber = searchParams.get("page_number") || "0";
    const pageSize = searchParams.get("page_size") || "100";

    const queryParams = new URLSearchParams();
    queryParams.set("page_number", pageNumber);
    queryParams.set("page_size", pageSize);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/organizations/${organizationId}/lists/${listId}/records?${queryParams.toString()}`;

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
      { error: "Failed to fetch list records" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; listId: string }> }
) {
  try {
    const token = await getAuthToken();
    const { organizationId, listId } = await params;

    const body = await request.json();

    let items: Array<{ record_id: string; values: Record<string, unknown> }>;
    if (body.items) {
      items = body.items;
    } else if (body.ids) {
      items = body.ids.map((id: string) => ({
        record_id: id,
        values: body.values?.[id] || {},
      }));
    } else {
      return NextResponse.json(
        { error: "Either 'items' or 'ids' must be provided" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}/organizations/${organizationId}/lists/${listId}/records`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ items }),
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
      { error: "Failed to add items to list" },
      { status: 500 }
    );
  }
}
