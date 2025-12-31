import { NextRequest, NextResponse } from "next/server";
import { enrichBusinesses } from "@/lib/explorium";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.EXPLORIUM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { businessIds } = body as { businessIds: string[] };

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return NextResponse.json(
        { error: "businessIds array is required" },
        { status: 400 }
      );
    }

    const result = await enrichBusinesses(apiKey, businessIds);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error enriching companies:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to enrich companies" },
      { status: 500 }
    );
  }
}
