import {
  CustomerStatus,
  InventoryStatus,
  IssueStatus,
  Priority,
  WorkItemStatus,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import {
  isInventoryLowStock,
  sortInventoryForList,
} from "@/features/inventory/inventory-data";
import {
  isResolvedIssueStatus,
  sortIssuesForList,
} from "@/features/issues/issue-data";
import {
  addUtcDays,
  isOrderOverdue,
  sortOrdersForList,
  startOfUtcDay,
} from "@/features/orders/order-data";
import { getPrismaClient } from "@/lib/db/prisma";

export const dashboardCustomerSelect = {
  archivedAt: true,
  id: true,
  name: true,
  status: true,
} satisfies Prisma.CustomerSelect;

export const dashboardWorkItemSelect = {
  archivedAt: true,
  completedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  dueDate: true,
  id: true,
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  priority: true,
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.WorkItemSelect;

export const dashboardInventorySelect = {
  archivedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  id: true,
  location: true,
  lowStockThreshold: true,
  name: true,
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  quantity: true,
  status: true,
  updatedAt: true,
  workItem: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.InventoryItemSelect;

export const dashboardIssueSelect = {
  archivedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  id: true,
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  priority: true,
  resolvedAt: true,
  status: true,
  title: true,
  updatedAt: true,
  workItem: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.IssueSelect;

export type DashboardCustomerRecord = Prisma.CustomerGetPayload<{
  select: typeof dashboardCustomerSelect;
}>;

export type DashboardWorkItemRecord = Prisma.WorkItemGetPayload<{
  select: typeof dashboardWorkItemSelect;
}>;

export type DashboardInventoryRecord = Prisma.InventoryItemGetPayload<{
  select: typeof dashboardInventorySelect;
}>;

export type DashboardIssueRecord = Prisma.IssueGetPayload<{
  select: typeof dashboardIssueSelect;
}>;

export type DashboardAggregationRecords = {
  customers: DashboardCustomerRecord[];
  inventoryItems: DashboardInventoryRecord[];
  issues: DashboardIssueRecord[];
  workItems: DashboardWorkItemRecord[];
};

export type DashboardSummaryOptions = {
  referenceDate?: Date;
  urgentLimit?: number;
};

export type DashboardMetricSummary = {
  activeCustomers: number;
  completedWorkItemsThisWeek: number;
  completedWorkThisWeek: number;
  highPriorityIssues: number;
  lowStockInventory: number;
  openOrders: number;
  overdueOrders: number;
  resolvedIssuesThisWeek: number;
};

export type DashboardWorkItemStatusBucket = {
  count: number;
  status: WorkItemStatus;
};

export type DashboardUrgentOrder = {
  customerName: string;
  dueDate: Date | null;
  href: string;
  id: string;
  ownerName: string;
  priority: Priority;
  status: WorkItemStatus;
  title: string;
};

export type DashboardUrgentIssue = {
  customerName: string;
  href: string;
  id: string;
  ownerName: string;
  priority: Priority;
  status: IssueStatus;
  title: string;
  updatedAt: Date;
  workItemTitle: string;
};

export type DashboardUrgentInventoryItem = {
  customerName: string;
  href: string;
  id: string;
  location: string;
  lowStockThreshold: number;
  name: string;
  ownerName: string;
  quantity: number;
  status: InventoryStatus;
  workItemTitle: string;
};

export type DashboardSummary = {
  charts: {
    workItemsByStatus: DashboardWorkItemStatusBucket[];
  };
  dateRange: {
    completedWeekEnd: Date;
    completedWeekStart: Date;
    referenceDayStart: Date;
  };
  metrics: DashboardMetricSummary;
  urgent: {
    highPriorityIssues: DashboardUrgentIssue[];
    lowStockInventory: DashboardUrgentInventoryItem[];
    overdueOrders: DashboardUrgentOrder[];
  };
};

export const dashboardOpenOrderStatuses: readonly WorkItemStatus[] = [
  WorkItemStatus.DRAFT,
  WorkItemStatus.ACTIVE,
  WorkItemStatus.BLOCKED,
];

export const dashboardHighPriorityValues: readonly Priority[] = [
  Priority.URGENT,
  Priority.HIGH,
];

export const dashboardWorkItemStatusOrder: readonly WorkItemStatus[] = [
  WorkItemStatus.DRAFT,
  WorkItemStatus.ACTIVE,
  WorkItemStatus.BLOCKED,
  WorkItemStatus.COMPLETED,
  WorkItemStatus.CANCELLED,
];

const inDateRange = (
  value: Date | null,
  startInclusive: Date,
  endExclusive: Date,
) => Boolean(value && value >= startInclusive && value < endExclusive);

const countByWorkItemStatus = (
  workItems: DashboardWorkItemRecord[],
): DashboardWorkItemStatusBucket[] => {
  const statusCounts = Object.fromEntries(
    dashboardWorkItemStatusOrder.map((status) => [status, 0]),
  ) as Record<WorkItemStatus, number>;

  for (const workItem of workItems) {
    statusCounts[workItem.status] += 1;
  }

  return dashboardWorkItemStatusOrder.map((status) => ({
    count: statusCounts[status],
    status,
  }));
};

const toUrgentOrder = (order: DashboardWorkItemRecord): DashboardUrgentOrder => ({
  customerName: order.customer?.name ?? "No customer",
  dueDate: order.dueDate,
  href: `/orders/${order.id}`,
  id: order.id,
  ownerName: order.owner?.name ?? "Unassigned",
  priority: order.priority,
  status: order.status,
  title: order.title,
});

const toUrgentIssue = (issue: DashboardIssueRecord): DashboardUrgentIssue => ({
  customerName: issue.customer?.name ?? "Internal",
  href: `/issues/${issue.id}`,
  id: issue.id,
  ownerName: issue.owner?.name ?? "Unassigned",
  priority: issue.priority,
  status: issue.status,
  title: issue.title,
  updatedAt: issue.updatedAt,
  workItemTitle: issue.workItem?.title ?? "No related work item",
});

const toUrgentInventoryItem = (
  item: DashboardInventoryRecord,
): DashboardUrgentInventoryItem => ({
  customerName: item.customer?.name ?? "Internal",
  href: `/inventory/${item.id}`,
  id: item.id,
  location: item.location ?? "Not recorded",
  lowStockThreshold: item.lowStockThreshold,
  name: item.name,
  ownerName: item.owner?.name ?? "Unassigned",
  quantity: item.quantity,
  status: item.status,
  workItemTitle: item.workItem?.title ?? "No related work item",
});

export const startOfUtcWeek = (date: Date) => {
  const dayStart = startOfUtcDay(date);
  const mondayOffset = (dayStart.getUTCDay() + 6) % 7;

  return addUtcDays(dayStart, -mondayOffset);
};

export const getUtcWeekRange = (date: Date) => {
  const start = startOfUtcWeek(date);

  return {
    end: addUtcDays(start, 7),
    start,
  };
};

export const isDashboardHighPriorityIssue = (issue: DashboardIssueRecord) =>
  !issue.archivedAt &&
  dashboardHighPriorityValues.includes(issue.priority) &&
  !isResolvedIssueStatus(issue.status);

export const buildDashboardSummaryFromRecords = (
  records: DashboardAggregationRecords,
  { referenceDate = new Date(), urgentLimit = 5 }: DashboardSummaryOptions = {},
): DashboardSummary => {
  const referenceDayStart = startOfUtcDay(referenceDate);
  const completedWeek = getUtcWeekRange(referenceDate);
  const activeCustomers = records.customers.filter(
    (customer) =>
      !customer.archivedAt && customer.status === CustomerStatus.ACTIVE,
  );
  const activeWorkItems = records.workItems.filter(
    (workItem) => !workItem.archivedAt,
  );
  const activeInventory = records.inventoryItems.filter(
    (item) => !item.archivedAt,
  );
  const activeIssues = records.issues.filter((issue) => !issue.archivedAt);
  const overdueOrders = activeWorkItems.filter((workItem) =>
    isOrderOverdue(workItem, referenceDate),
  );
  const highPriorityIssues = activeIssues.filter(isDashboardHighPriorityIssue);
  const lowStockInventory = activeInventory.filter(isInventoryLowStock);
  const completedWorkItemsThisWeek = activeWorkItems.filter(
    (workItem) =>
      workItem.status === WorkItemStatus.COMPLETED &&
      inDateRange(
        workItem.completedAt,
        completedWeek.start,
        completedWeek.end,
      ),
  );
  const resolvedIssuesThisWeek = activeIssues.filter(
    (issue) =>
      isResolvedIssueStatus(issue.status) &&
      inDateRange(issue.resolvedAt, completedWeek.start, completedWeek.end),
  );

  return {
    charts: {
      workItemsByStatus: countByWorkItemStatus(activeWorkItems),
    },
    dateRange: {
      completedWeekEnd: completedWeek.end,
      completedWeekStart: completedWeek.start,
      referenceDayStart,
    },
    metrics: {
      activeCustomers: activeCustomers.length,
      completedWorkItemsThisWeek: completedWorkItemsThisWeek.length,
      completedWorkThisWeek:
        completedWorkItemsThisWeek.length + resolvedIssuesThisWeek.length,
      highPriorityIssues: highPriorityIssues.length,
      lowStockInventory: lowStockInventory.length,
      openOrders: activeWorkItems.filter((workItem) =>
        dashboardOpenOrderStatuses.includes(workItem.status),
      ).length,
      overdueOrders: overdueOrders.length,
      resolvedIssuesThisWeek: resolvedIssuesThisWeek.length,
    },
    urgent: {
      highPriorityIssues: sortIssuesForList(highPriorityIssues)
        .slice(0, urgentLimit)
        .map(toUrgentIssue),
      lowStockInventory: sortInventoryForList(lowStockInventory)
        .slice(0, urgentLimit)
        .map(toUrgentInventoryItem),
      overdueOrders: sortOrdersForList(overdueOrders, referenceDate)
        .slice(0, urgentLimit)
        .map(toUrgentOrder),
    },
  };
};

export const getDashboardSummary = async ({
  prisma = getPrismaClient(),
  referenceDate = new Date(),
  urgentLimit = 5,
}: DashboardSummaryOptions & { prisma?: PrismaClient } = {}) => {
  const [customers, workItems, inventoryItems, issues] = await Promise.all([
    prisma.customer.findMany({
      select: dashboardCustomerSelect,
    }),
    prisma.workItem.findMany({
      select: dashboardWorkItemSelect,
    }),
    prisma.inventoryItem.findMany({
      select: dashboardInventorySelect,
    }),
    prisma.issue.findMany({
      select: dashboardIssueSelect,
    }),
  ]);

  return buildDashboardSummaryFromRecords(
    {
      customers,
      inventoryItems,
      issues,
      workItems,
    },
    {
      referenceDate,
      urgentLimit,
    },
  );
};
