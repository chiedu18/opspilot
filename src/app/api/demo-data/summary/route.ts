import { apiError, apiInternalError, apiOk } from "@/lib/api/responses";
import { getDemoSession } from "@/lib/auth/demo-session";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getDemoSession();
  if (!session) {
    return apiError("UNAUTHORIZED", "Sign in to view demo data.", { status: 401 });
  }
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
      prisma.customer.count({ where: { workspaceId: session.workspaceId } }),
      prisma.workItem.count({ where: { workspaceId: session.workspaceId } }),
      prisma.inventoryItem.count({ where: { workspaceId: session.workspaceId } }),
      prisma.issue.count({ where: { workspaceId: session.workspaceId } }),
      prisma.activityEvent.count({ where: { workspaceId: session.workspaceId } }),
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

    return apiInternalError("Unable to read OpsPilot demo data summary.");
  }
}
