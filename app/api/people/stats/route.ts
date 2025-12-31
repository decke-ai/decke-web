import { NextRequest, NextResponse } from "next/server";
import { fetchPeopleStats, PeopleFilters } from "@/lib/explorium";

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
    const { filters } = body as { filters: PeopleFilters };

    const result = await fetchPeopleStats(apiKey, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching people stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch people stats" },
      { status: 500 }
    );
  }
}
