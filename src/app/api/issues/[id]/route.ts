import {
  issueSelect,
  toIssueApi,
  updateIssueData,
} from "@/features/issues/issue-data";
import { apiArchivedIssueUpdate } from "@/features/issues/issue-errors";
import { validateIssueRelationships } from "@/features/issues/issue-route-rules";
import { issueUpdateSchema } from "@/features/issues/issue-validation";
import {
  apiError,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiValidationError,
} from "@/lib/api/responses";
import { getDemoSession } from "@/lib/auth/demo-session";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IssueRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: IssueRouteContext) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const issue = await prisma.issue.findFirst({
      select: issueSelect,
      where: { id, workspaceId: session.workspaceId },
    });

    if (!issue) {
      return apiNotFound("Issue");
    }

    return apiOk(toIssueApi(issue));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to read issue.", error);

    return apiInternalError("Unable to read issue.");
  }
}

export async function PATCH(request: Request, { params }: IssueRouteContext) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;
  const validated = await validateJsonBody(request, issueUpdateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();
    const existingIssue = await prisma.issue.findFirst({
      select: {
        archivedAt: true,
        customerId: true,
        id: true,
        ownerId: true,
        resolutionNotes: true,
        resolvedAt: true,
        status: true,
        workItemId: true,
      },
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existingIssue) {
      return apiNotFound("Issue");
    }

    if (existingIssue.archivedAt) {
      return apiArchivedIssueUpdate();
    }

    const relationshipError = await validateIssueRelationships(
      prisma,
      validated.data,
      { existing: existingIssue, workspaceId: session.workspaceId },
    );

    if (relationshipError) {
      return relationshipError;
    }

    const issue = await prisma.issue.update({
      data: updateIssueData(validated.data, existingIssue),
      select: issueSelect,
      where: { id },
    });

    return apiOk(toIssueApi(issue));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to update issue.", error);

    return apiInternalError("Unable to update issue.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: IssueRouteContext,
) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const existingIssue = await prisma.issue.findFirst({
      select: {
        archivedAt: true,
        id: true,
      },
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existingIssue) {
      return apiNotFound("Issue");
    }

    const issue = await prisma.issue.update({
      data: {
        archivedAt: existingIssue.archivedAt ?? new Date(),
      },
      select: issueSelect,
      where: { id },
    });

    return apiOk(toIssueApi(issue));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to archive issue.", error);

    return apiInternalError("Unable to archive issue.");
  }
}
