import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_URL = "https://api.decke.ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const organizationId = crypto.randomUUID();
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/lists/${listId}/items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
  } catch (error) {
    console.error("Add to list error:", error);
    return NextResponse.json(
      { error: "Failed to add items to list" },
      { status: 500 }
    );
  }
}
