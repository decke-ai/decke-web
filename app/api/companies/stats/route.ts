import { NextRequest, NextResponse } from "next/server";
import { fetchBusinessesStats, BusinessFilters } from "@/lib/explorium";

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
    const { filters } = body as { filters: BusinessFilters };

    const result = await fetchBusinessesStats(apiKey, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
