import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export type PersonContactEnrichmentType = "email" | "phone" | "both";

export interface PersonEmail {
  address: string;
  type?: string | null;
}

export interface PersonPhone {
  phone_number: string;
}

export interface PersonContact {
  person_id: string;
  id?: string;
  professional_email?: string | null;
  professional_email_status?: string | null;
  emails?: PersonEmail[] | null;
  mobile_phone?: string | null;
  phone_numbers?: PersonPhone[] | null;
  email_enriched_date?: string | null;
  phone_enriched_date?: string | null;
  created_date?: string;
  updated_date?: string;
}

export interface ContactsEnrichResponse {
  contacts: PersonContact[];
  credits_consumed: number;
  total_requested: number;
  total_with_email: number;
  total_with_phone: number;
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
    const { person_ids, enrichment_type = "both" } = body as {
      person_ids: string[];
      enrichment_type?: PersonContactEnrichmentType;
    };

    if (!person_ids?.length) {
      return NextResponse.json(
        { error: "person_ids is required" },
        { status: 400 }
      );
    }

    if (person_ids.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 people per request" },
        { status: 400 }
      );
    }

    const url = `${API_URL}/organizations/${organizationId}/providers/explorium/people/contacts`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ person_ids, enrichment_type }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data: ContactsEnrichResponse = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to enrich contacts" },
      { status: 500 }
    );
  }
}
