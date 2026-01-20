import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/api";
import type { MetaServerEvent, MetaEventResponse } from "@/lib/meta/types";

export const runtime = "nodejs";

const API_URL = process.env.API_URL || "https://api.decke.ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();

    const { pixel_id, events, test_event_code } = body as {
      pixel_id: string;
      events: MetaServerEvent[];
      test_event_code?: string;
    };

    if (!pixel_id) {
      return NextResponse.json(
        { error: "pixel_id is required" },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "events array is required and must not be empty" },
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

    const response = await fetch(
      `${API_URL}/organizations/${organizationId}/providers/meta/pixels/${pixel_id}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: events,
          test_event_code,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data: MetaEventResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send events to Meta" },
      { status: 500 }
    );
  }
}
