import { apiError, apiOk } from "@/lib/api/responses";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const prisma = getPrismaClient();
    const [
      teamMembers,
      customers,
      workItems,
      inventoryItems,
      issues,
      activityEvents,
    ] = await prisma.$transaction([
      prisma.teamMember.count(),
      prisma.customer.count(),
      prisma.workItem.count(),
      prisma.inventoryItem.count(),
      prisma.issue.count(),
      prisma.activityEvent.count(),
    ]);

    return apiOk({
      label: "OpsPilot demo data summary",
      source: "current database rows",
      counts: {
        teamMembers,
        customers,
        workItems,
        inventoryItems,
        issues,
        activityEvents,
      },
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to read OpsPilot demo data summary.", error);

    return apiError(
      "INTERNAL_ERROR",
      "Unable to read OpsPilot demo data summary.",
      { status: 500 },
    );
  }
}
