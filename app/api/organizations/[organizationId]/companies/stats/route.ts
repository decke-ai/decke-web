import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import { BusinessFilters } from "@/lib/explorium/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

const COMPANY_FILTER_TO_BACKEND_MAP: Record<string, string> = {
  country: "company_country_iso_alpha_2",
  city_region_country: "company_location",
  google_category: "company_google_category",
  naics_category: "company_naics",
  linkedin_category: "company_linkedin_category",
  company_size: "company_size",
  company_revenue: "company_revenue",
  number_of_locations: "company_location",
  company_age: "company_age",
  company_tech_stack_tech: "company_technology_stack",
  company_tech_stack_categories: "company_technology_stack_category",
};

function buildFiltersPayload(
  filters: BusinessFilters
): Record<string, string[] | null> {
  const payload: Record<string, string[] | null> = {};

  const arrayFilterFields: (keyof BusinessFilters)[] = [
    "country",
    "city_region_country",
    "google_category",
    "naics_category",
    "linkedin_category",
    "company_size",
    "company_revenue",
    "number_of_locations",
    "company_age",
    "company_tech_stack_tech",
    "company_tech_stack_categories",
  ];

  for (const field of arrayFilterFields) {
    const values = filters[field] as string[] | undefined;
    if (values?.length) {
      const backendField = COMPANY_FILTER_TO_BACKEND_MAP[field] || field;
      payload[backendField] = values;
    }
  }

  return payload;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { filters } = body as { filters: BusinessFilters };

    const builtFilters = buildFiltersPayload(filters);
    const payload: Record<string, unknown> = {};

    if (Object.keys(builtFilters).length > 0) {
      payload.filters = builtFilters;
    }

    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/providers/explorium/companies/statistics`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
    console.error("Company stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company stats" },
      { status: 500 }
    );
  }
}
