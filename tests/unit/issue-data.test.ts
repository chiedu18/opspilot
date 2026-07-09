import { describe, expect, it } from "vitest";

import {
  CustomerStatus,
  IssueCategory,
  IssueStatus,
  Priority,
  TeamMemberStatus,
  TeamRole,
  WorkItemStatus,
} from "../../src/generated/prisma/client";
import {
  buildIssueResolvedAtUpdate,
  buildIssueWhereInput,
  hasIssueResolutionNotes,
  isResolvedIssueStatus,
  sortIssuesForList,
  toIssueApi,
} from "../../src/features/issues/issue-data";

const updatedAt = new Date("2026-07-07T12:00:00.000Z");

describe("issue data helpers", () => {
  it("hides archived issues by default", () => {
    const where = buildIssueWhereInput({
      archiveState: "WITHOUT",
      includeArchived: false,
    });

    expect(where).toEqual({
      archivedAt: null,
    });
  });

  it("supports explicit archived visibility", () => {
    expect(
      buildIssueWhereInput({
        archiveState: "ONLY",
        includeArchived: false,
      }),
    ).toEqual({
      archivedAt: { not: null },
    });

    expect(
      buildIssueWhereInput({
        archiveState: "WITHOUT",
        includeArchived: true,
      }),
    ).toEqual({});
  });

  it("builds search, relation, status, priority, category, and resolution filters", () => {
    const where = buildIssueWhereInput({
      archiveState: "WITHOUT",
      category: IssueCategory.BUG,
      customerId: "cust-northstar-outfitters",
      includeArchived: false,
      ownerId: "team-daniel-kim",
      priority: Priority.HIGH,
      q: "auth",
      resolutionState: "UNRESOLVED",
      status: IssueStatus.IN_PROGRESS,
      workItemId: "work-northstar-pos-device-rollout",
    });

    expect(where).toEqual({
      archivedAt: null,
      category: IssueCategory.BUG,
      customerId: "cust-northstar-outfitters",
      ownerId: "team-daniel-kim",
      priority: Priority.HIGH,
      status: IssueStatus.IN_PROGRESS,
      workItemId: "work-northstar-pos-device-rollout",
      OR: [
        { title: { contains: "auth", mode: "insensitive" } },
        { description: { contains: "auth", mode: "insensitive" } },
        { resolutionNotes: { contains: "auth", mode: "insensitive" } },
        {
          customer: {
            is: { name: { contains: "auth", mode: "insensitive" } },
          },
        },
        {
          workItem: {
            is: { title: { contains: "auth", mode: "insensitive" } },
          },
        },
        {
          owner: {
            is: { name: { contains: "auth", mode: "insensitive" } },
          },
        },
      ],
      AND: [
        {
          status: {
            notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
          },
        },
      ],
    });
  });

  it("derives resolved state from issue status", () => {
    expect(isResolvedIssueStatus(IssueStatus.RESOLVED)).toBe(true);
    expect(isResolvedIssueStatus(IssueStatus.CLOSED)).toBe(true);
    expect(isResolvedIssueStatus(IssueStatus.OPEN)).toBe(false);
  });

  it("requires resolution notes only for resolved or closed statuses", () => {
    expect(
      hasIssueResolutionNotes({
        resolutionNotes: null,
        status: IssueStatus.OPEN,
      }),
    ).toBe(true);

    expect(
      hasIssueResolutionNotes({
        resolutionNotes: "",
        status: IssueStatus.CLOSED,
      }),
    ).toBe(false);

    expect(
      hasIssueResolutionNotes({
        resolutionNotes: "Verified and closed.",
        status: IssueStatus.RESOLVED,
      }),
    ).toBe(true);
  });

  it("sets and clears resolvedAt from status transitions", () => {
    const now = new Date("2026-07-08T15:00:00.000Z");

    expect(
      buildIssueResolvedAtUpdate(
        IssueStatus.RESOLVED,
        {
          resolvedAt: null,
          status: IssueStatus.IN_PROGRESS,
        },
        now,
      ),
    ).toEqual({ resolvedAt: now });

    expect(
      buildIssueResolvedAtUpdate(
        IssueStatus.OPEN,
        {
          resolvedAt: now,
          status: IssueStatus.RESOLVED,
        },
        now,
      ),
    ).toEqual({ resolvedAt: null });

    expect(
      buildIssueResolvedAtUpdate(undefined, {
        resolvedAt: null,
        status: IssueStatus.OPEN,
      }),
    ).toEqual({});
  });

  it("sorts active blockers and urgent issues before resolved issues", () => {
    const issues = [
      {
        id: "resolved-urgent",
        archivedAt: null,
        priority: Priority.URGENT,
        status: IssueStatus.RESOLVED,
        updatedAt,
      },
      {
        id: "open-low",
        archivedAt: null,
        priority: Priority.LOW,
        status: IssueStatus.OPEN,
        updatedAt,
      },
      {
        id: "blocked-medium",
        archivedAt: null,
        priority: Priority.MEDIUM,
        status: IssueStatus.BLOCKED,
        updatedAt,
      },
      {
        id: "open-urgent",
        archivedAt: null,
        priority: Priority.URGENT,
        status: IssueStatus.OPEN,
        updatedAt,
      },
    ];

    expect(sortIssuesForList(issues).map((issue) => issue.id)).toEqual([
      "blocked-medium",
      "open-urgent",
      "open-low",
      "resolved-urgent",
    ]);
  });

  it("maps issue records to API payloads with related summaries", () => {
    const payload = toIssueApi({
      id: "issue-demo",
      title: "Demo issue",
      category: IssueCategory.BUG,
      priority: Priority.HIGH,
      status: IssueStatus.RESOLVED,
      description: "QA reproduced and verified the issue.",
      resolutionNotes: "Patched and verified.",
      resolvedAt: new Date("2026-07-07T12:00:00.000Z"),
      ownerId: "team-daniel-kim",
      owner: {
        id: "team-daniel-kim",
        name: "Daniel Kim",
        email: "daniel.kim@opspilot-demo.test",
        role: TeamRole.QA_ENGINEER,
        status: TeamMemberStatus.ACTIVE,
      },
      customerId: "cust-demo",
      customer: {
        id: "cust-demo",
        name: "Demo Customer",
        status: CustomerStatus.ACTIVE,
        archivedAt: null,
      },
      workItemId: "work-demo",
      workItem: {
        id: "work-demo",
        title: "Demo work item",
        status: WorkItemStatus.ACTIVE,
        customerId: "cust-demo",
        archivedAt: null,
        customer: {
          id: "cust-demo",
          name: "Demo Customer",
          status: CustomerStatus.ACTIVE,
          archivedAt: null,
        },
      },
      createdAt: new Date("2026-07-01T12:00:00.000Z"),
      updatedAt,
      archivedAt: null,
      _count: {
        activityEvents: 3,
      },
    });

    expect(payload.customer?.name).toBe("Demo Customer");
    expect(payload.workItem?.title).toBe("Demo work item");
    expect(payload.owner?.name).toBe("Daniel Kim");
    expect(payload.counts).toEqual({ activityEvents: 3 });
    expect(payload.isResolved).toBe(true);
  });
});
