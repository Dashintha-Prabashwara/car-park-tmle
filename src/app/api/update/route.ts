import { NextRequest, NextResponse } from "next/server";
import { isValidApiKey } from "@/lib/auth";
import { processEsp32Update } from "@/lib/db";
import { EventType, UpdatePayload } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_EVENTS: EventType[] = [
  "SYSTEM_START",
  "BAY",
  "ENTRY",
  "EXIT",
  "FULL",
  "HEARTBEAT",
];

export async function POST(request: NextRequest) {
  // 1. Authenticate with constant-time comparison
  const apiKeyHeader = request.headers.get("x-api-key");
  if (!isValidApiKey(apiKeyHeader)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Parse and validate JSON body strictly
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON format" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Request body must be an object" },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  // Check event string
  if (
    typeof payload.event !== "string" ||
    !VALID_EVENTS.includes(payload.event as EventType)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid event. Must be one of: ${VALID_EVENTS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Check bay occupancy indicators (p1, p2, p3 must be 0 or 1)
  if (
    (payload.p1 !== 0 && payload.p1 !== 1) ||
    (payload.p2 !== 0 && payload.p2 !== 1) ||
    (payload.p3 !== 0 && payload.p3 !== 1)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "p1, p2, and p3 are required and must be either 0 or 1",
      },
      { status: 400 }
    );
  }

  // Check bay number if event is BAY
  if (payload.event === "BAY") {
    if (
      typeof payload.bay !== "number" ||
      ![1, 2, 3].includes(payload.bay)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "bay is required for 'BAY' event and must be 1, 2, or 3",
        },
        { status: 400 }
      );
    }
  } else if (payload.bay !== undefined && payload.bay !== null) {
    if (typeof payload.bay !== "number") {
      return NextResponse.json(
        { ok: false, error: "bay must be a number if specified" },
        { status: 400 }
      );
    }
  }

  // Check total if supplied
  if (payload.total !== undefined && payload.total !== null) {
    if (typeof payload.total !== "number") {
      return NextResponse.json(
        { ok: false, error: "total must be a number if specified" },
        { status: 400 }
      );
    }
  }

  // 3. Process database update
  try {
    const validPayload: UpdatePayload = {
      event: payload.event as EventType,
      p1: payload.p1 as number,
      p2: payload.p2 as number,
      p3: payload.p3 as number,
      ...(typeof payload.bay === "number" ? { bay: payload.bay } : {}),
      ...(typeof payload.total === "number" ? { total: payload.total } : {}),
    };

    await processEsp32Update(validPayload);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error processing ESP32 update:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
