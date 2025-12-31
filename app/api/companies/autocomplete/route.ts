import { NextRequest, NextResponse } from "next/server";
import { fetchAutocomplete, AutocompleteField } from "@/lib/explorium";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.EXPLORIUM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const field = searchParams.get("field") as AutocompleteField;
    const query = searchParams.get("query") || "";
    const semanticSearch = searchParams.get("semantic_search") === "true";

    if (!field) {
      return NextResponse.json(
        { error: "Field parameter is required" },
        { status: 400 }
      );
    }

    const result = await fetchAutocomplete(apiKey, field, query, semanticSearch);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching autocomplete:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch autocomplete" },
      { status: 500 }
    );
  }
}
