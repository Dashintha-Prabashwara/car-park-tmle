import { NextResponse } from "next/server";
import { getStatusSnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getStatusSnapshot();

    return NextResponse.json(status, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
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
