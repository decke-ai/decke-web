import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export interface CompanyTechnographics {
  company_id: string;
  company_technology_analytic?: string[] | null;
  company_technology_collaboration?: string[] | null;
  company_technology_communication?: string[] | null;
  company_technology_computer_network?: string[] | null;
  company_technology_customer_management?: string[] | null;
  company_technology_devops_and_development?: string[] | null;
  company_technology_ecommerce?: string[] | null;
  company_technology_finance_and_accounting?: string[] | null;
  company_technology_health?: string[] | null;
  company_technology_management?: string[] | null;
  company_technology_marketing?: string[] | null;
  company_technology_operation_management?: string[] | null;
  company_technology_operation_software?: string[] | null;
  company_technology_people?: string[] | null;
  company_technology_platform_and_storage?: string[] | null;
  company_technology_product_and_design?: string[] | null;
  company_technology_productivity_and_operation?: string[] | null;
  company_technology_programming_language_and_framework?: string[] | null;
  company_technology_sale?: string[] | null;
  company_technology_security?: string[] | null;
  company_technology_test?: string[] | null;
}

export interface TechnographicsEnrichResponse {
  companies: CompanyTechnographics[];
  credits_consumed: number;
  total_requested: number;
  total_with_data: number;
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
    const { company_ids } = body as { company_ids: string[] };

    if (!company_ids?.length) {
      return NextResponse.json(
        { error: "company_ids is required" },
        { status: 400 }
      );
    }

    if (company_ids.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 companies per request" },
        { status: 400 }
      );
    }

    const url = `${API_URL}/organizations/${organizationId}/providers/explorium/companies/technographics`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ company_ids }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data: TechnographicsEnrichResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to enrich technographics" },
      { status: 500 }
    );
  }
}
