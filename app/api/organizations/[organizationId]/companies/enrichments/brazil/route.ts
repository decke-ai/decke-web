import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export interface BrazilEnrichment {
  document: string | null;
  domain: string;
  enrichment: Record<string, unknown> | null;
  score: number;
}

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    const url = `${API_URL}/organizations/${organizationId}/companies/brazil/enrichments?domain=${encodeURIComponent(domain)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data: BrazilEnrichment = await response.json();

    console.log("[Brazil Enrichment] Response data:", JSON.stringify(data, null, 2));
    if (data.enrichment) {
      console.log("[Brazil Enrichment] Enrichment keys:", Object.keys(data.enrichment));
      console.log("[Brazil Enrichment] capital_social:", data.enrichment.capital_social);
      console.log("[Brazil Enrichment] cnae_principal:", data.enrichment.cnae_principal);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to enrich company with Brazil data" },
      { status: 500 }
    );
  }
}
