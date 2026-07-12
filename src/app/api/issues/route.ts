import { NextRequest } from "next/server";

import {
  buildIssueWhereInput,
  createIssueData,
  issueListOrderBy,
  issueSelect,
  sortIssuesForList,
  toIssueApi,
} from "@/features/issues/issue-data";
import { validateIssueRelationships } from "@/features/issues/issue-route-rules";
import {
  issueCreateSchema,
  issueListQuerySchema,
} from "@/features/issues/issue-validation";
import {
  apiError,
  apiInternalError,
  apiOk,
  apiValidationError,
} from "@/lib/api/responses";
import { getDemoSession } from "@/lib/auth/demo-session";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateInput, validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listFiltersFromRequest = (request: NextRequest) => ({
  archiveState: request.nextUrl.searchParams.get("archiveState") ?? undefined,
  category: request.nextUrl.searchParams.get("category") ?? undefined,
  customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
  includeArchived:
    request.nextUrl.searchParams.get("includeArchived") ?? undefined,
  ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
  priority: request.nextUrl.searchParams.get("priority") ?? undefined,
  q: request.nextUrl.searchParams.get("q") ?? undefined,
  resolutionState:
    request.nextUrl.searchParams.get("resolutionState") ?? undefined,
  status: request.nextUrl.searchParams.get("status") ?? undefined,
  workItemId: request.nextUrl.searchParams.get("workItemId") ?? undefined,
});

export async function GET(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const filters = validateInput(
    issueListQuerySchema,
    listFiltersFromRequest(request),
  );

  if (!filters.success) {
    return apiValidationError(filters.details);
  }

  try {
    const prisma = getPrismaClient();
    const issues = await prisma.issue.findMany({
      orderBy: issueListOrderBy,
      select: issueSelect,
      take: 200,
      where: { AND: [{ workspaceId: session.workspaceId }, buildIssueWhereInput(filters.data)] },
    });

    return apiOk({
      filters: filters.data,
      issues: sortIssuesForList(issues).map(toIssueApi),
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to list issues.", error);

    return apiInternalError("Unable to list issues.");
  }
}

export async function POST(request: Request) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const validated = await validateJsonBody(request, issueCreateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();
    const relationshipError = await validateIssueRelationships(
      prisma,
      validated.data,
      { workspaceId: session.workspaceId },
    );

    if (relationshipError) {
      return relationshipError;
    }

    const issue = await prisma.issue.create({
      data: {
        ...createIssueData(validated.data),
        workspace: { connect: { id: session.workspaceId } },
      },
      select: issueSelect,
    });

    return apiOk(toIssueApi(issue), { status: 201 });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to create issue.", error);

    return apiInternalError("Unable to create issue.");
  }
}
