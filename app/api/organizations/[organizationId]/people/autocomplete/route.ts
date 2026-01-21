import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import { PeopleAutocompleteField } from "@/lib/explorium/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

const PEOPLE_AUTOCOMPLETE_FIELD_TO_BACKEND_MAP: Record<string, string> = {
  job_title: "person_job_title",
  job_level: "person_job_level",
  job_department: "person_job_department",
  company_name: "person_company_name",
  country: "person_country_name",
  region_country_code: "person_region_name",
  city_region_country: "person_city_name",
  company_size: "person_company_size",
  company_revenue: "person_company_revenue",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const field = searchParams.get("field") as PeopleAutocompleteField;
    const query = searchParams.get("query") || "";
    const semantic = searchParams.get("semantic") === "true" || searchParams.get("semantic_search") === "true";

    if (!field) {
      return NextResponse.json(
        { error: "Field parameter is required" },
        { status: 400 }
      );
    }

    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendField = PEOPLE_AUTOCOMPLETE_FIELD_TO_BACKEND_MAP[field] || field;

    const backendParams = new URLSearchParams({
      field: backendField,
    });
    if (query) {
      backendParams.set("query", query);
    }
    if (semantic) {
      backendParams.set("semantic", "true");
    }

    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/providers/explorium/people/autocompletes?${backendParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
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
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch autocomplete options" },
      { status: 500 }
    );
  }
}
