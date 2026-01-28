import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import { BusinessFilters, FILTER_TO_SEARCH_API_MAP } from "@/lib/explorium/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

function buildFiltersPayload(
  filters: BusinessFilters
): Record<string, string[]> {
  const payload: Record<string, string[]> = {};

  const arrayFilterFields: (keyof BusinessFilters)[] = [
    "country",
    "region_country_code",
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
    "job_title",
    "job_department",
    "job_level",
    "business_intent_topics",
  ];

  for (const field of arrayFilterFields) {
    const values = filters[field] as string[] | undefined;
    if (values?.length) {
      const searchApiField = FILTER_TO_SEARCH_API_MAP[field] || field;
      payload[searchApiField] = values;
    }
  }

  if (filters.name) {
    payload.company_name = [filters.name];
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
    const { filters, page = 1, pageSize = 50 } = body as {
      filters: BusinessFilters;
      page?: number;
      pageSize?: number;
    };

    const builtFilters = buildFiltersPayload(filters);
    const payload: Record<string, unknown> = {
      page,
      page_size: pageSize,
    };

    if (Object.keys(builtFilters).length > 0) {
      payload.filters = builtFilters;
    }

    const url = `${API_URL}/organizations/${organizationId}/providers/explorium/companies/searches`;

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

    const companies = (data.content || []).map((company: Record<string, unknown>) => ({
      business_id: company.company_id,
      id: company.company_id,
      name: company.company_name,
      domain: company.company_domain,
      website: company.company_website,
      description: company.company_description,
      business_description: company.company_description,
      industry: company.company_linkedin_category,
      linkedin_industry_category: company.company_linkedin_category,
      employee_range: company.company_employee,
      number_of_employees_range: company.company_employee,
      revenue_range: company.company_revenue,
      yearly_revenue_range: company.company_revenue,
      city_name: company.company_city_name,
      state_region_name: company.company_region_name,
      country_name: company.company_country_name,
      logo: company.company_avatar,
      logo_url: company.company_avatar,
      linkedin_url: company.company_linkedin_url,
      linkedin_company_url: company.company_linkedin_url,
      address: {
        street: company.company_address,
        city: company.company_city_name,
        state: company.company_region_name,
        country: company.company_country_name,
        postal_code: company.company_zip_code,
      },
    }));

    return NextResponse.json({
      businesses: companies,
      results: companies,
      data: companies,
      total: data.total_elements || companies.length,
      page: data.page_number || page,
      page_size: data.page_size || pageSize,
      total_pages: data.total_pages || Math.ceil((data.total_elements || companies.length) / pageSize),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search companies" },
      { status: 500 }
    );
  }
}
