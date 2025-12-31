import { NextRequest, NextResponse } from "next/server";
import { fetchBusinesses, BusinessFilters } from "@/lib/explorium";

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
    const { filters, page = 1, pageSize = 50 } = body as {
      filters: BusinessFilters;
      page?: number;
      pageSize?: number;
    };

    const result = await fetchBusinesses(apiKey, filters, { page, pageSize });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
