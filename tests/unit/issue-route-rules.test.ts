import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  IssueCategory,
  IssueStatus,
  Priority,
} from "../../src/generated/prisma/client";
import { validateIssueRelationships } from "../../src/features/issues/issue-route-rules";

const readErrorPayload = async (response: Response | null) => {
  if (!response) {
    return null;
  }

  return response.json();
};

describe("issue route rules", () => {
  it("returns a field-level error when resolved updates lack notes", async () => {
    const response = await validateIssueRelationships(
      {} as PrismaClient,
      {
        status: IssueStatus.RESOLVED,
      },
      {
        existing: {
          archivedAt: null,
          customerId: null,
          id: "issue-demo",
          ownerId: "team-daniel-kim",
          resolutionNotes: null,
          resolvedAt: null,
          status: IssueStatus.IN_PROGRESS,
          workItemId: null,
        },
      },
    );

    expect(response?.status).toBe(400);
    await expect(readErrorPayload(response)).resolves.toMatchObject({
      error: {
        code: "ISSUE_RESOLUTION_REQUIRED",
        details: {
          fieldErrors: {
            resolutionNotes: [
              "Resolution notes are required when resolving or closing an issue.",
            ],
          },
        },
      },
    });
  });

  it("rejects inactive or missing owners", async () => {
    const prisma = {
      teamMember: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaClient;

    const response = await validateIssueRelationships(prisma, {
      title: "Demo issue",
      category: IssueCategory.BUG,
      priority: Priority.HIGH,
      status: IssueStatus.OPEN,
      ownerId: "team-inactive",
      customerId: null,
      workItemId: null,
      description: "QA found a problem.",
      resolutionNotes: null,
    });

    expect(response?.status).toBe(400);
    await expect(readErrorPayload(response)).resolves.toMatchObject({
      error: {
        code: "INVALID_ISSUE_OWNER",
        details: {
          fieldErrors: {
            ownerId: ["Choose an active owner."],
          },
        },
      },
    });
  });

  it("rejects customer and order mismatches", async () => {
    const prisma = {
      customer: {
        findFirst: vi.fn().mockResolvedValue({ id: "cust-a" }),
      },
      teamMember: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-daniel-kim" }),
      },
      workItem: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: "work-a", customerId: "cust-b" }),
      },
    } as unknown as PrismaClient;

    const response = await validateIssueRelationships(prisma, {
      title: "Demo issue",
      category: IssueCategory.BUG,
      priority: Priority.HIGH,
      status: IssueStatus.OPEN,
      ownerId: "team-daniel-kim",
      customerId: "cust-a",
      workItemId: "work-a",
      description: "QA found a problem.",
      resolutionNotes: null,
    });

    expect(response?.status).toBe(400);
    await expect(readErrorPayload(response)).resolves.toMatchObject({
      error: {
        code: "ISSUE_RELATIONSHIP_MISMATCH",
        details: {
          fieldErrors: {
            customerId: ["Customer must match the selected order."],
            workItemId: ["Order must belong to the selected customer."],
          },
        },
      },
    });
  });
});
