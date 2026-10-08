import { NextRequest, NextResponse } from "next/server";
import { getEventsForCsv } from "@/lib/db";
import { formatColomboTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const category = searchParams.get("category") || undefined;

    const rows = await getEventsForCsv(dateFrom, dateTo, category);

    // CSV header row
    const lines = ["ID,Timestamp_UTC,Timestamp_Colombo,Event,Bay,State"];

    for (const row of rows) {
      const utc = new Date(row.created_at).toISOString();
      const colombo = formatColomboTime(row.created_at, true).replace(/,/g, "");
      const bay = row.bay !== null && row.bay !== undefined ? row.bay : "";
      const state =
        row.state !== null && row.state !== undefined
          ? Boolean(row.state)
            ? "OCCUPIED"
            : "AVAILABLE"
          : "";

      lines.push(`${row.id},"${utc}","${colombo}",${row.event},${bay},${state}`);
    }

    const csvContent = lines.join("\n");
    const todayStr = new Date().toISOString().split("T")[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="smartpark-events-${todayStr}.csv"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Error generating CSV export:", err);
    return new NextResponse("Failed to generate CSV", { status: 500 });
  }
}
