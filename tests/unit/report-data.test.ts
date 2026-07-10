import { describe, expect, it } from "vitest";

import {
  CustomerStatus,
  Priority,
  TeamMemberStatus,
  TeamRole,
  WorkItemKind,
  WorkItemStatus,
} from "../../src/generated/prisma/client";
import { toOrderApi } from "../../src/features/orders/order-data";
import { buildCsv, buildReportCsv } from "../../src/features/reports/report-csv";
import {
  buildOrdersReportWhereInput,
  parseReportFilters,
  reportQueryToSearchParams,
  type OrdersReportData,
} from "../../src/features/reports/report-data";

const referenceDate = new Date("2026-07-09T12:00:00.000Z");

describe("report data and CSV helpers", () => {
  it("defaults to the orders report and validates report-specific filters", () => {
    const filters = parseReportFilters({
      dueDateBucket: "OVERDUE",
      priority: "HIGH",
      q: "campaign",
      status: "BLOCKED",
    });

    expect(filters.success).toBe(true);

    if (!filters.success) {
      return;
    }

    expect(filters.data).toMatchObject({
      archiveState: "WITHOUT",
      dueDateBucket: "OVERDUE",
      priority: Priority.HIGH,
      q: "campaign",
      report: "orders",
      status: WorkItemStatus.BLOCKED,
    });
  });

  it("rejects invalid report filters", () => {
    const filters = parseReportFilters({
      report: "orders",
      status: "OPEN",
    });

    expect(filters.success).toBe(false);
  });

  it("builds order report query filters with due buckets and date ranges", () => {
    const where = buildOrdersReportWhereInput(
      {
        archiveState: "WITHOUT",
        customerId: "cust-bluepeak-nonprofit",
        dueDateBucket: "OVERDUE",
        dueFrom: "2026-07-01",
        dueTo: "2026-07-09",
        kind: WorkItemKind.CAMPAIGN,
        ownerId: "team-olivia-chen",
        priority: Priority.HIGH,
        q: "donor",
        report: "orders",
        status: WorkItemStatus.BLOCKED,
      },
      referenceDate,
    );

    expect(where).toEqual({
      archivedAt: null,
      customerId: "cust-bluepeak-nonprofit",
      kind: WorkItemKind.CAMPAIGN,
      ownerId: "team-olivia-chen",
      priority: Priority.HIGH,
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
          dueDate: {
            lt: new Date("2026-07-09T00:00:00.000Z"),
          },
          status: {
            in: [WorkItemStatus.ACTIVE, WorkItemStatus.BLOCKED],
          },
        },
        {
          dueDate: {
            gte: new Date("2026-07-01T00:00:00.000Z"),
            lt: new Date("2026-07-10T00:00:00.000Z"),
          },
        },
      ],
    });
  });

  it("serializes only active report filters into export params", () => {
    const filters = parseReportFilters({
      category: "BUG",
      priority: "URGENT",
      report: "issues",
      resolutionState: "UNRESOLVED",
      status: "BLOCKED",
      workItemId: "work-northstar-pos-device-rollout",
    });

    expect(filters.success).toBe(true);

    if (!filters.success) {
      return;
    }

    const params = reportQueryToSearchParams(filters.data);

    expect(params.toString()).toContain("report=issues");
    expect(params.toString()).toContain("category=BUG");
    expect(params.toString()).toContain("resolutionState=UNRESOLVED");
    expect(params.toString()).toContain(
      "workItemId=work-northstar-pos-device-rollout",
    );
    expect(params.has("dueDateBucket")).toBe(false);
  });

  it("builds header-only CSVs for empty reports", () => {
    type EmptyCsvRow = {
      name: string;
      status: string;
    };
    const csv = buildCsv<EmptyCsvRow>(
      [
        { header: "Name", value: (row) => row.name },
        { header: "Status", value: (row) => row.status },
      ],
      [],
    );

    expect(csv).toBe("Name,Status");
  });

  it("escapes CSV values and uses readable report headers", () => {
    const order = toOrderApi(
      {
        id: "work-demo",
        title: 'Comma, quote "demo"',
        kind: WorkItemKind.CAMPAIGN,
        status: WorkItemStatus.BLOCKED,
        priority: Priority.HIGH,
        dueDate: new Date("2026-07-01T12:00:00.000Z"),
        completedAt: null,
        estimatedValueCents: 123456,
        notes: "Demo note.",
        customerId: "cust-demo",
        customer: {
          archivedAt: null,
          id: "cust-demo",
          name: "Demo Customer",
          status: CustomerStatus.ACTIVE,
        },
        ownerId: "team-demo",
        owner: {
          email: "demo@opspilot-demo.test",
          id: "team-demo",
          name: "Demo Owner",
          role: TeamRole.OPERATIONS_MANAGER,
          status: TeamMemberStatus.ACTIVE,
        },
        createdAt: new Date("2026-06-01T12:00:00.000Z"),
        updatedAt: new Date("2026-07-08T12:00:00.000Z"),
        archivedAt: null,
        _count: {
          inventoryItems: 2,
          issues: 1,
        },
      },
      referenceDate,
    );
    const report: OrdersReportData = {
      filters: {
        archiveState: "WITHOUT",
        report: "orders",
      },
      metrics: {
        overdue: 1,
        rows: 1,
        totalValueCents: 123456,
      },
      report: "orders",
      rows: [order],
    };

    const csv = buildReportCsv(report);

    expect(csv.split("\r\n")[0]).toBe(
      "Work item,Kind,Status,Priority,Customer,Owner,Due date,Completed date,Estimated value USD,Overdue,Issue count,Inventory count,Archived,Updated date",
    );
    expect(csv).toContain('"Comma, quote ""demo"""');
    expect(csv).toContain("Campaign,Blocked,High");
    expect(csv).toContain("1234.56");
    expect(csv).toContain("Yes");
  });
});
