import { NextRequest, NextResponse } from "next/server";
import { getStatusSnapshot } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = await getStatusSnapshot();

    // Generate lightweight ETag from the core payload state
    const stateFingerprint = JSON.stringify({
      bays: status.bays.map((b) => [b.id, b.occupied, b.changedAt]),
      free: status.free,
      vehiclesToday: status.vehiclesToday,
      recentTop: status.recent.length > 0 ? status.recent[0].id : null,
      online: status.online,
      anomalies: status.anomalies?.staleSensors?.length,
    });
    const etag = `"${crypto.createHash("md5").update(stateFingerprint).digest("hex")}"`;

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "no-cache",
        },
      });
    }

    return NextResponse.json(status, {
      status: 200,
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Error retrieving status snapshot:", err);
    return NextResponse.json(
      { error: "Failed to fetch car park status" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
