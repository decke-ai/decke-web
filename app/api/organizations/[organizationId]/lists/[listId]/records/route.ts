import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; listId: string }> }
) {
  try {
    const token = await getAuthToken();
    const { organizationId, listId } = await params;

    const body = await request.json();

    const items = body.ids.map((id: string) => ({
      record_id: id,
      values: body.values?.[id] || {},
    }));

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
