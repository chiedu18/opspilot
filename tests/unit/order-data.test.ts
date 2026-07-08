import { describe, expect, it } from "vitest";

import {
  CustomerStatus,
  Priority,
  TeamMemberStatus,
  TeamRole,
  WorkItemKind,
  WorkItemStatus,
} from "../../src/generated/prisma/client";
import {
  buildOrderCompletionUpdate,
  buildOrderWhereInput,
  isOrderOverdue,
  sortOrdersForList,
  startOfUtcDay,
  toOrderApi,
} from "../../src/features/orders/order-data";

const referenceDate = new Date("2026-07-08T09:00:00.000Z");

describe("order data helpers", () => {
  it("hides archived work items by default", () => {
    const where = buildOrderWhereInput(
      {
        archiveState: "WITHOUT",
        includeArchived: false,
      },
      referenceDate,
    );

    expect(where).toEqual({
      archivedAt: null,
    });
  });

  it("supports explicit archived visibility", () => {
    expect(
      buildOrderWhereInput(
        {
          archiveState: "ONLY",
          includeArchived: false,
        },
        referenceDate,
      ),
    ).toEqual({
      archivedAt: { not: null },
    });

    expect(
      buildOrderWhereInput(
        {
          archiveState: "WITHOUT",
          includeArchived: true,
        },
        referenceDate,
      ),
    ).toEqual({});
  });

  it("builds search, relation, status, priority, kind, and overdue filters", () => {
    const where = buildOrderWhereInput(
      {
        archiveState: "WITHOUT",
        customerId: "cust-bluepeak-nonprofit",
        dueDateBucket: "OVERDUE",
        includeArchived: false,
        kind: WorkItemKind.CAMPAIGN,
        ownerId: "team-olivia-chen",
        priority: Priority.URGENT,
        q: "donor",
        status: WorkItemStatus.BLOCKED,
      },
      referenceDate,
    );

    expect(where).toEqual({
      archivedAt: null,
      customerId: "cust-bluepeak-nonprofit",
      kind: WorkItemKind.CAMPAIGN,
      ownerId: "team-olivia-chen",
      priority: Priority.URGENT,
      status: WorkItemStatus.BLOCKED,
      OR: [
        { title: { contains: "donor", mode: "insensitive" } },
        { notes: { contains: "donor", mode: "insensitive" } },
        { customer: { name: { contains: "donor", mode: "insensitive" } } },
        {
          owner: {
            is: { name: { contains: "donor", mode: "insensitive" } },
          },
        },
      ],
      AND: [
        {
          dueDate: { lt: startOfUtcDay(referenceDate) },
          status: {
            in: [WorkItemStatus.ACTIVE, WorkItemStatus.BLOCKED],
          },
        },
      ],
    });
  });

  it("derives overdue from due date, status, and archive state", () => {
    expect(
      isOrderOverdue(
        {
          archivedAt: null,
          dueDate: new Date("2026-07-07T12:00:00.000Z"),
          status: WorkItemStatus.ACTIVE,
        },
        referenceDate,
      ),
    ).toBe(true);

    expect(
      isOrderOverdue(
        {
          archivedAt: null,
          dueDate: new Date("2026-07-07T12:00:00.000Z"),
          status: WorkItemStatus.COMPLETED,
        },
        referenceDate,
      ),
    ).toBe(false);

    expect(
      isOrderOverdue(
        {
          archivedAt: new Date("2026-07-07T12:00:00.000Z"),
          dueDate: new Date("2026-07-01T12:00:00.000Z"),
          status: WorkItemStatus.BLOCKED,
        },
        referenceDate,
      ),
    ).toBe(false);
  });

  it("sets and clears completedAt from status transitions", () => {
    const now = new Date("2026-07-08T15:00:00.000Z");

    expect(
      buildOrderCompletionUpdate(
        WorkItemStatus.COMPLETED,
        {
          completedAt: null,
          status: WorkItemStatus.ACTIVE,
        },
        now,
      ),
    ).toEqual({ completedAt: now });

    expect(
      buildOrderCompletionUpdate(
        WorkItemStatus.ACTIVE,
        {
          completedAt: now,
          status: WorkItemStatus.COMPLETED,
        },
        now,
      ),
    ).toEqual({ completedAt: null });

    expect(
      buildOrderCompletionUpdate(undefined, {
        completedAt: null,
        status: WorkItemStatus.ACTIVE,
      }),
    ).toEqual({});
  });

  it("sorts overdue work before upcoming work, then by due date and priority", () => {
    const updatedAt = new Date("2026-07-07T12:00:00.000Z");
    const orders = [
      {
        id: "upcoming",
        archivedAt: null,
        dueDate: new Date("2026-07-20T12:00:00.000Z"),
        priority: Priority.URGENT,
        status: WorkItemStatus.ACTIVE,
        updatedAt,
      },
      {
        id: "overdue-medium",
        archivedAt: null,
        dueDate: new Date("2026-07-01T12:00:00.000Z"),
        priority: Priority.MEDIUM,
        status: WorkItemStatus.ACTIVE,
        updatedAt,
      },
      {
        id: "overdue-urgent",
        archivedAt: null,
        dueDate: new Date("2026-07-01T12:00:00.000Z"),
        priority: Priority.URGENT,
        status: WorkItemStatus.BLOCKED,
        updatedAt,
      },
    ];

    expect(sortOrdersForList(orders, referenceDate).map((order) => order.id))
      .toEqual(["overdue-urgent", "overdue-medium", "upcoming"]);
  });

  it("maps order records to API payloads with related summaries", () => {
    const dueDate = new Date("2026-07-01T12:00:00.000Z");
    const updatedAt = new Date("2026-07-07T12:00:00.000Z");

    const payload = toOrderApi(
      {
        id: "work-demo",
        title: "Demo campaign",
        kind: WorkItemKind.CAMPAIGN,
        status: WorkItemStatus.BLOCKED,
        priority: Priority.URGENT,
        dueDate,
        completedAt: null,
        estimatedValueCents: 500000,
        notes: "Demo note.",
        customerId: "cust-demo",
        customer: {
          id: "cust-demo",
          name: "Demo Customer",
          status: CustomerStatus.ACTIVE,
          archivedAt: null,
        },
        ownerId: "team-olivia-chen",
        owner: {
          id: "team-olivia-chen",
          name: "Olivia Chen",
          email: "olivia.chen@opspilot-demo.test",
          role: TeamRole.OPERATIONS_MANAGER,
          status: TeamMemberStatus.ACTIVE,
        },
        createdAt: new Date("2026-06-01T12:00:00.000Z"),
        updatedAt,
        archivedAt: null,
        _count: {
          inventoryItems: 2,
          issues: 3,
        },
      },
      referenceDate,
    );

    expect(payload.customer.name).toBe("Demo Customer");
    expect(payload.owner?.name).toBe("Olivia Chen");
    expect(payload.counts).toEqual({
      inventoryItems: 2,
      issues: 3,
    });
    expect(payload.dueDate).toBe(dueDate);
    expect(payload.updatedAt).toBe(updatedAt);
    expect(payload.isOverdue).toBe(true);
  });
});
