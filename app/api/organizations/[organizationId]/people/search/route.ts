import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import { PeopleFilters } from "@/lib/explorium/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

const PEOPLE_FILTER_TO_BACKEND_MAP: Record<string, string> = {
  job_title: "person_job_title",
  job_level: "person_job_level",
  job_department: "person_job_department",
  business_id: "company_id",
  country: "person_country_iso_alpha_2",
  company_size: "company_size",
  company_revenue: "company_revenue",
  google_category: "company_google_category",
  naics_category: "company_naics",
  linkedin_category: "company_linkedin_category",
};

function buildFiltersPayload(
  filters: PeopleFilters
): Record<string, string[] | null> {
  const payload: Record<string, string[] | null> = {};

  const arrayFilterFields: (keyof PeopleFilters)[] = [
    "job_title",
    "job_level",
    "job_department",
    "business_id",
    "country",
    "company_size",
    "company_revenue",
    "google_category",
    "naics_category",
    "linkedin_category",
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
    const { filters, page = 0, pageSize = 50 } = body as {
      filters: PeopleFilters;
      page?: number;
      pageSize?: number;
    };

    const builtFilters = buildFiltersPayload(filters);
    const payload: Record<string, unknown> = {};

    if (Object.keys(builtFilters).length > 0) {
      payload.filters = builtFilters;
    }

    const queryParams = new URLSearchParams({
      page_number: page.toString(),
      page_size: pageSize.toString(),
    });

    const url = `${API_URL}/organizations/${organizationId}/providers/explorium/people/searches?${queryParams}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    const people = (data.content || []).map((person: Record<string, unknown>) => ({
      prospect_id: person.person_id,
      id: person.person_id,
      first_name: person.person_first_name,
      last_name: person.person_last_name,
      full_name: person.person_full_name,
      email: person.person_email,
      phone: person.person_phone,
      mobile_phone: person.person_mobile_phone,
      job_title: person.person_job_title,
      job_level: person.person_job_level,
      job_department: person.person_job_department,
      linkedin_url: person.person_linkedin,
      linkedin_profile: person.person_linkedin,
      linkedin: person.person_linkedin,
      company_name: person.company_name,
      company_domain: person.company_domain,
      company_linkedin_url: person.company_linkedin_url,
      company_logo: person.company_avatar,
      business_id: person.company_id,
      country: person.person_country_name,
      country_name: person.person_country_name,
      region: person.person_region_name,
      city: person.person_city_name,
      profile_picture: person.person_avatar,
      seniority: person.person_job_seniority,
      experiences: person.person_experiences,
      interests: person.person_interests,
    }));

    return NextResponse.json({
      prospects: people,
      people: people,
      results: people,
      data: people,
      total: data.total_elements || people.length,
      page: data.page_number || page,
      page_size: data.page_size || pageSize,
      total_pages: data.total_pages || Math.ceil((data.total_elements || people.length) / pageSize),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search people" },
      { status: 500 }
    );
  }
}
