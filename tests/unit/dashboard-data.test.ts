import { describe, expect, it } from "vitest";

import {
  customers,
  inventoryItems,
  issues,
  teamMembers,
  workItems,
} from "../../prisma/seed-data";
import {
  CustomerStatus,
  InventoryStatus,
  IssueStatus,
  Priority,
  WorkItemStatus,
} from "../../src/generated/prisma/client";
import {
  buildDashboardSummaryFromRecords,
  getUtcWeekRange,
  type DashboardAggregationRecords,
} from "../../src/features/dashboard/dashboard-data";

const phaseTenReferenceDate = new Date("2026-07-09T12:00:00.000Z");

const requiredString = (value: string | null | undefined, field: string) => {
  if (!value) {
    throw new Error(`Missing required seed ${field}.`);
  }

  return value;
};

const requiredMapValue = <TValue>(
  value: TValue | undefined,
  field: string,
) => {
  if (!value) {
    throw new Error(`Missing required seed ${field}.`);
  }

  return value;
};

const optionalDate = (value: Date | string | null | undefined) =>
  value ? new Date(value) : null;

const requiredDate = (value: Date | string | null | undefined, field: string) => {
  const date = optionalDate(value);

  if (!date) {
    throw new Error(`Missing required seed ${field}.`);
  }

  return date;
};

const demoCustomer = {
  id: "cust-demo",
  name: "Demo Customer",
};

const seedRecords = (): DashboardAggregationRecords => {
  const customerSummaries = new Map(
    customers.map((customer) => [
      requiredString(customer.id, "customer id"),
      {
        id: requiredString(customer.id, "customer id"),
        name: customer.name,
      },
    ]),
  );
  const teamSummaries = new Map(
    teamMembers.map((member) => [
      requiredString(member.id, "team member id"),
      {
        id: requiredString(member.id, "team member id"),
        name: member.name,
      },
    ]),
  );
  const workItemSummaries = new Map(
    workItems.map((workItem) => [
      requiredString(workItem.id, "work item id"),
      {
        id: requiredString(workItem.id, "work item id"),
        title: workItem.title,
      },
    ]),
  );

  return {
    customers: customers.map((customer) => ({
      archivedAt: optionalDate(customer.archivedAt),
      id: requiredString(customer.id, "customer id"),
      name: customer.name,
      status: customer.status ?? CustomerStatus.PROSPECT,
    })),
    inventoryItems: inventoryItems.map((item) => ({
      archivedAt: optionalDate(item.archivedAt),
      customer: item.customerId
        ? (customerSummaries.get(item.customerId) ?? null)
        : null,
      id: requiredString(item.id, "inventory id"),
      location: item.location ?? null,
      lowStockThreshold: item.lowStockThreshold ?? 0,
      name: item.name,
      owner: item.ownerId ? (teamSummaries.get(item.ownerId) ?? null) : null,
      quantity: item.quantity ?? 0,
      status: item.status ?? InventoryStatus.AVAILABLE,
      updatedAt: requiredDate(item.updatedAt, "inventory updatedAt"),
      workItem: item.workItemId
        ? (workItemSummaries.get(item.workItemId) ?? null)
        : null,
    })),
    issues: issues.map((issue) => ({
      archivedAt: optionalDate(issue.archivedAt),
      customer: issue.customerId
        ? (customerSummaries.get(issue.customerId) ?? null)
        : null,
      id: requiredString(issue.id, "issue id"),
      owner: issue.ownerId ? (teamSummaries.get(issue.ownerId) ?? null) : null,
      priority: issue.priority ?? Priority.MEDIUM,
      resolvedAt: optionalDate(issue.resolvedAt),
      status: issue.status ?? IssueStatus.OPEN,
      title: issue.title,
      updatedAt: requiredDate(issue.updatedAt, "issue updatedAt"),
      workItem: issue.workItemId
        ? (workItemSummaries.get(issue.workItemId) ?? null)
        : null,
    })),
    workItems: workItems.map((workItem) => ({
      archivedAt: optionalDate(workItem.archivedAt),
      completedAt: optionalDate(workItem.completedAt),
      customer: requiredMapValue(
        customerSummaries.get(workItem.customerId),
        `customer for work item ${workItem.id}`,
      ),
      dueDate: optionalDate(workItem.dueDate),
      id: requiredString(workItem.id, "work item id"),
      owner: workItem.ownerId
        ? (teamSummaries.get(workItem.ownerId) ?? null)
        : null,
      priority: workItem.priority ?? Priority.MEDIUM,
      status: workItem.status ?? WorkItemStatus.DRAFT,
      title: workItem.title,
      updatedAt: requiredDate(workItem.updatedAt, "work item updatedAt"),
    })),
  };
};

const emptyRecords = (): DashboardAggregationRecords => ({
  customers: [],
  inventoryItems: [],
  issues: [],
  workItems: [],
});

describe("dashboard data helpers", () => {
  it("builds the seeded Phase 10 metric baseline", () => {
    const summary = buildDashboardSummaryFromRecords(seedRecords(), {
      referenceDate: phaseTenReferenceDate,
    });

    expect(summary.metrics).toEqual({
      activeCustomers: 7,
      completedWorkItemsThisWeek: 2,
      completedWorkThisWeek: 6,
      highPriorityIssues: 12,
      lowStockInventory: 4,
      openOrders: 15,
      overdueOrders: 5,
      resolvedIssuesThisWeek: 4,
    });
    expect(
      Object.fromEntries(
        summary.charts.workItemsByStatus.map((bucket) => [
          bucket.status,
          bucket.count,
        ]),
      ),
    ).toEqual({
      [WorkItemStatus.ACTIVE]: 10,
      [WorkItemStatus.BLOCKED]: 3,
      [WorkItemStatus.CANCELLED]: 1,
      [WorkItemStatus.COMPLETED]: 4,
      [WorkItemStatus.DRAFT]: 2,
    });
    expect(summary.dateRange.referenceDayStart.toISOString()).toBe(
      "2026-07-09T00:00:00.000Z",
    );
    expect(summary.dateRange.completedWeekStart.toISOString()).toBe(
      "2026-07-06T00:00:00.000Z",
    );
    expect(summary.dateRange.completedWeekEnd.toISOString()).toBe(
      "2026-07-13T00:00:00.000Z",
    );
  });

  it("returns focused urgent queues from the seeded data", () => {
    const summary = buildDashboardSummaryFromRecords(seedRecords(), {
      referenceDate: phaseTenReferenceDate,
      urgentLimit: 3,
    });

    expect(summary.urgent.overdueOrders.map((order) => order.id)).toEqual([
      "work-bluepeak-donor-campaign",
      "work-northstar-pos-device-rollout",
      "work-greenfield-sku-cleanup",
    ]);
    expect(summary.urgent.highPriorityIssues).toHaveLength(3);
    expect(summary.urgent.highPriorityIssues[0]).toMatchObject({
      href: "/issues/issue-bluepeak-donor-segment",
      status: IssueStatus.BLOCKED,
      title: "Donor segment file blocked",
    });
    expect(summary.urgent.lowStockInventory.map((item) => item.href)).toEqual([
      "/inventory/inv-asset-label-rolls",
      "/inventory/inv-greenfield-barcode-scanners",
      "/inventory/inv-metro-printer-toner",
    ]);
  });

  it("uses UTC Monday-to-Monday week boundaries for completed work", () => {
    expect(getUtcWeekRange(new Date("2026-07-12T23:59:59.000Z"))).toEqual({
      end: new Date("2026-07-13T00:00:00.000Z"),
      start: new Date("2026-07-06T00:00:00.000Z"),
    });

    const summary = buildDashboardSummaryFromRecords(
      {
        ...emptyRecords(),
        issues: [
          {
            archivedAt: null,
            customer: null,
            id: "issue-start",
            owner: null,
            priority: Priority.HIGH,
            resolvedAt: new Date("2026-07-06T00:00:00.000Z"),
            status: IssueStatus.RESOLVED,
            title: "Resolved at week start",
            updatedAt: new Date("2026-07-06T00:00:00.000Z"),
            workItem: null,
          },
          {
            archivedAt: null,
            customer: null,
            id: "issue-next-week",
            owner: null,
            priority: Priority.HIGH,
            resolvedAt: new Date("2026-07-13T00:00:00.000Z"),
            status: IssueStatus.RESOLVED,
            title: "Resolved next week",
            updatedAt: new Date("2026-07-13T00:00:00.000Z"),
            workItem: null,
          },
        ],
        workItems: [
          {
            archivedAt: null,
            completedAt: new Date("2026-07-12T23:59:59.000Z"),
            customer: demoCustomer,
            dueDate: null,
            id: "work-end",
            owner: null,
            priority: Priority.MEDIUM,
            status: WorkItemStatus.COMPLETED,
            title: "Completed before week end",
            updatedAt: new Date("2026-07-12T23:59:59.000Z"),
          },
          {
            archivedAt: null,
            completedAt: new Date("2026-07-13T00:00:00.000Z"),
            customer: demoCustomer,
            dueDate: null,
            id: "work-next-week",
            owner: null,
            priority: Priority.MEDIUM,
            status: WorkItemStatus.COMPLETED,
            title: "Completed next week",
            updatedAt: new Date("2026-07-13T00:00:00.000Z"),
          },
        ],
      },
      { referenceDate: new Date("2026-07-12T12:00:00.000Z") },
    );

    expect(summary.metrics.completedWorkItemsThisWeek).toBe(1);
    expect(summary.metrics.resolvedIssuesThisWeek).toBe(1);
    expect(summary.metrics.completedWorkThisWeek).toBe(2);
  });

  it("excludes archived and non-operational records from dashboard metrics", () => {
    const summary = buildDashboardSummaryFromRecords(
      {
        customers: [
          {
            archivedAt: null,
            id: "active",
            name: "Active customer",
            status: CustomerStatus.ACTIVE,
          },
          {
            archivedAt: new Date("2026-07-01T12:00:00.000Z"),
            id: "archived",
            name: "Archived active customer",
            status: CustomerStatus.ACTIVE,
          },
        ],
        inventoryItems: [
          {
            archivedAt: null,
            customer: null,
            id: "low",
            location: null,
            lowStockThreshold: 4,
            name: "Low stock item",
            owner: null,
            quantity: 1,
            status: InventoryStatus.AVAILABLE,
            updatedAt: new Date("2026-07-07T12:00:00.000Z"),
            workItem: null,
          },
          {
            archivedAt: null,
            customer: null,
            id: "retired-low",
            location: null,
            lowStockThreshold: 4,
            name: "Retired low stock item",
            owner: null,
            quantity: 1,
            status: InventoryStatus.RETIRED,
            updatedAt: new Date("2026-07-07T12:00:00.000Z"),
            workItem: null,
          },
        ],
        issues: [
          {
            archivedAt: null,
            customer: null,
            id: "urgent-open",
            owner: null,
            priority: Priority.URGENT,
            resolvedAt: null,
            status: IssueStatus.OPEN,
            title: "Urgent open issue",
            updatedAt: new Date("2026-07-07T12:00:00.000Z"),
            workItem: null,
          },
          {
            archivedAt: null,
            customer: null,
            id: "urgent-resolved",
            owner: null,
            priority: Priority.URGENT,
            resolvedAt: new Date("2026-07-07T12:00:00.000Z"),
            status: IssueStatus.RESOLVED,
            title: "Urgent resolved issue",
            updatedAt: new Date("2026-07-07T12:00:00.000Z"),
            workItem: null,
          },
        ],
        workItems: [
          {
            archivedAt: null,
            completedAt: null,
            customer: demoCustomer,
            dueDate: new Date("2026-07-08T12:00:00.000Z"),
            id: "overdue",
            owner: null,
            priority: Priority.HIGH,
            status: WorkItemStatus.ACTIVE,
            title: "Overdue active work",
            updatedAt: new Date("2026-07-08T12:00:00.000Z"),
          },
          {
            archivedAt: null,
            completedAt: null,
            customer: demoCustomer,
            dueDate: new Date("2026-07-09T12:00:00.000Z"),
            id: "same-day",
            owner: null,
            priority: Priority.HIGH,
            status: WorkItemStatus.ACTIVE,
            title: "Same-day active work",
            updatedAt: new Date("2026-07-09T12:00:00.000Z"),
          },
          {
            archivedAt: null,
            completedAt: null,
            customer: demoCustomer,
            dueDate: new Date("2026-07-01T12:00:00.000Z"),
            id: "cancelled",
            owner: null,
            priority: Priority.URGENT,
            status: WorkItemStatus.CANCELLED,
            title: "Cancelled work",
            updatedAt: new Date("2026-07-01T12:00:00.000Z"),
          },
        ],
      },
      { referenceDate: phaseTenReferenceDate },
    );

    expect(summary.metrics.activeCustomers).toBe(1);
    expect(summary.metrics.openOrders).toBe(2);
    expect(summary.metrics.overdueOrders).toBe(1);
    expect(summary.metrics.highPriorityIssues).toBe(1);
    expect(summary.metrics.lowStockInventory).toBe(1);
  });

  it("returns zero metrics and complete chart buckets for empty data", () => {
    const summary = buildDashboardSummaryFromRecords(emptyRecords(), {
      referenceDate: phaseTenReferenceDate,
    });

    expect(summary.metrics).toEqual({
      activeCustomers: 0,
      completedWorkItemsThisWeek: 0,
      completedWorkThisWeek: 0,
      highPriorityIssues: 0,
      lowStockInventory: 0,
      openOrders: 0,
      overdueOrders: 0,
      resolvedIssuesThisWeek: 0,
    });
    expect(summary.charts.workItemsByStatus).toEqual([
      { count: 0, status: WorkItemStatus.DRAFT },
      { count: 0, status: WorkItemStatus.ACTIVE },
      { count: 0, status: WorkItemStatus.BLOCKED },
      { count: 0, status: WorkItemStatus.COMPLETED },
      { count: 0, status: WorkItemStatus.CANCELLED },
    ]);
    expect(summary.urgent).toEqual({
      highPriorityIssues: [],
      lowStockInventory: [],
      overdueOrders: [],
    });
  });
});
