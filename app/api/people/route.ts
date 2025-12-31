import { NextRequest, NextResponse } from "next/server";
import { fetchPeople, enrichPeopleWithCompanyLogos, PeopleFilters } from "@/lib/explorium";

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
      filters: PeopleFilters;
      page?: number;
      pageSize?: number;
    };

    const result = await fetchPeople(apiKey, filters, { page, pageSize });

    // Get people array from result
    const people = result.prospects || result.people || result.results || result.data || [];

    // Enrich people with company logos
    const enrichedPeople = await enrichPeopleWithCompanyLogos(apiKey, people);

    // Return result with enriched people
    return NextResponse.json({
      ...result,
      people: enrichedPeople,
      results: enrichedPeople,
      data: enrichedPeople,
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch people" },
      { status: 500 }
    );
  }
}
