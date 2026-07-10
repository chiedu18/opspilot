import { NextRequest } from "next/server";

import { buildReportCsv } from "@/features/reports/report-csv";
import {
  getReportData,
  parseReportFilters,
} from "@/features/reports/report-data";
import { isDatabaseConfigurationError } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reportParamsFromRequest = (request: NextRequest) => {
  const params: Record<string, string> = {};

  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
};

const reportFilename = (report: string, rowCount: number) => {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = rowCount === 0 ? "empty" : `${rowCount}-rows`;

  return `opspilot-${report}-report-${date}-${suffix}.csv`;
};

export async function GET(request: NextRequest) {
  const filters = parseReportFilters(reportParamsFromRequest(request));

  if (!filters.success) {
    return new Response("Report filters are invalid.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 400,
    });
  }

  try {
    const report = await getReportData(filters.data, { limit: 1000 });
    const csv = buildReportCsv(report);
    const filename = reportFilename(report.report, report.rows.length);

    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return new Response(
        "Database access is not configured for this environment.",
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          status: 503,
        },
      );
    }

    console.error("Failed to export report CSV.", error);

    return new Response("Unable to export report CSV.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 500,
    });
  }
}
