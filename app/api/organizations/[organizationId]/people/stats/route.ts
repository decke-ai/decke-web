import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import { PeopleFilters } from "@/lib/explorium/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

const PEOPLE_FILTER_TO_BACKEND_MAP: Record<string, string> = {
  job_title: "person_job_title",
  job_level: "person_job_level",
  job_department: "person_job_department",
  company_name: "person_company_name",
  company_domain: "person_company_domain",
  country: "person_country_name",
  region_country_code: "person_region_name",
  city_region_country: "person_city_name",
  company_size: "person_company_size",
  company_revenue: "person_company_revenue",
};

function buildFiltersPayload(
  filters: PeopleFilters
): Record<string, string[] | null> {
  const payload: Record<string, string[] | null> = {};

  const arrayFilterFields: (keyof PeopleFilters)[] = [
    "job_title",
    "job_level",
    "job_department",
    "company_name",
    "company_domain",
    "country",
    "region_country_code",
    "city_region_country",
    "company_size",
    "company_revenue",
  ];

  for (const field of arrayFilterFields) {
    const values = filters[field] as string[] | undefined;
    if (values?.length) {
      const backendField = PEOPLE_FILTER_TO_BACKEND_MAP[field] || field;
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
    const { filters } = body as { filters: PeopleFilters };

    const builtFilters = buildFiltersPayload(filters);
    const payload: Record<string, unknown> = {};

    if (Object.keys(builtFilters).length > 0) {
      payload.filters = builtFilters;
    }

    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/providers/explorium/people/statistics`,
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
    console.error("People stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch people stats" },
      { status: 500 }
    );
  }
}
