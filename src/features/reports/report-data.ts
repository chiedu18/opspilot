import {
  IssueStatus,
  Priority,
  WorkItemStatus,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import {
  buildInventoryWhereInput,
  filterInventoryByLowStockState,
  inventorySelect,
  isInventoryLowStock,
  listInventoryCustomerChoices,
  listInventoryOwnerChoices,
  listInventoryWorkItemChoices,
  sortInventoryForList,
  toInventoryApi,
} from "@/features/inventory/inventory-data";
import {
  buildIssueWhereInput,
  isResolvedIssueStatus,
  issueSelect,
  listIssueCustomerChoices,
  listIssueOwnerChoices,
  listIssueWorkItemChoices,
  sortIssuesForList,
  toIssueApi,
} from "@/features/issues/issue-data";
import {
  addUtcDays,
  buildOrderWhereInput,
  listOrderCustomerChoices,
  listOrderOwnerChoices,
  orderSelect,
  sortOrdersForList,
  toOrderApi,
} from "@/features/orders/order-data";
import { getPrismaClient } from "@/lib/db/prisma";
import { requireSandboxWorkspaceId } from "@/lib/sandbox/session";
import { validateInput, type ValidationResult } from "@/lib/validation/request";

import {
  inventoryReportQuerySchema,
  issuesReportQuerySchema,
  ordersReportQuerySchema,
  reportTypeSchema,
  type InventoryReportQuery,
  type IssuesReportQuery,
  type OrdersReportQuery,
  type ReportQuery,
  type ReportType,
} from "./report-validation";

export type ReportSearchParams = Record<string, string | string[] | undefined>;

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const readReportSearchParam = readSearchParam;

const reportParamsFromSearch = (searchParams: ReportSearchParams) => ({
  archiveState: readSearchParam(searchParams.archiveState),
  category: readSearchParam(searchParams.category),
  customerId: readSearchParam(searchParams.customerId),
  dueDateBucket: readSearchParam(searchParams.dueDateBucket),
  dueFrom: readSearchParam(searchParams.dueFrom),
  dueTo: readSearchParam(searchParams.dueTo),
  kind: readSearchParam(searchParams.kind),
  lowStockState: readSearchParam(searchParams.lowStockState),
  ownerId: readSearchParam(searchParams.ownerId),
  priority: readSearchParam(searchParams.priority),
  q: readSearchParam(searchParams.q),
  report: readSearchParam(searchParams.report) ?? "orders",
  resolutionState: readSearchParam(searchParams.resolutionState),
  status: readSearchParam(searchParams.status),
  workItemId: readSearchParam(searchParams.workItemId),
});

export const parseReportFilters = (
  searchParams: ReportSearchParams,
): ValidationResult<ReportQuery> => {
  const params = reportParamsFromSearch(searchParams);
  const report = validateInput(reportTypeSchema, params.report);

  if (!report.success) {
    return {
      details: report.details,
      success: false,
    };
  }

  if (report.data === "issues") {
    return validateInput(issuesReportQuerySchema, {
      ...params,
      report: "issues",
    });
  }

  if (report.data === "inventory") {
    return validateInput(inventoryReportQuerySchema, {
      ...params,
      report: "inventory",
    });
  }

  return validateInput(ordersReportQuerySchema, {
    ...params,
    report: "orders",
  });
};

const archiveStateForFilters = (archiveState: ReportQuery["archiveState"]) =>
  archiveState;

const utcDateFromInput = (value: string, hour = 0) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
};

const applyDueDateRange = (
  filters: Pick<OrdersReportQuery, "dueFrom" | "dueTo">,
) => {
  if (!filters.dueFrom && !filters.dueTo) {
    return undefined;
  }

  return {
    ...(filters.dueFrom
      ? { gte: utcDateFromInput(filters.dueFrom, 0) }
      : {}),
    ...(filters.dueTo ? { lt: addUtcDays(utcDateFromInput(filters.dueTo, 0), 1) } : {}),
  };
};

export const buildOrdersReportWhereInput = (
  filters: OrdersReportQuery,
  referenceDate = new Date(),
): Prisma.WorkItemWhereInput => {
  const where = buildOrderWhereInput(
    {
      archiveState: archiveStateForFilters(filters.archiveState),
      customerId: filters.customerId,
      dueDateBucket: filters.dueDateBucket,
      includeArchived: false,
      kind: filters.kind,
      ownerId: filters.ownerId,
      priority: filters.priority,
      q: filters.q,
      status: filters.status,
    },
    referenceDate,
  );
  const dueDateRange = applyDueDateRange(filters);

  if (!dueDateRange) {
    return where;
  }

  return {
    ...where,
    AND: [...(Array.isArray(where.AND) ? where.AND : []), { dueDate: dueDateRange }],
  };
};

export const buildIssuesReportWhereInput = (
  filters: IssuesReportQuery,
): Prisma.IssueWhereInput =>
  buildIssueWhereInput({
    archiveState: filters.archiveState,
    category: filters.category,
    customerId: filters.customerId,
    includeArchived: false,
    ownerId: filters.ownerId,
    priority: filters.priority,
    q: filters.q,
    resolutionState: filters.resolutionState,
    status: filters.status,
    workItemId: filters.workItemId,
  });

export const buildInventoryReportWhereInput = (
  filters: InventoryReportQuery,
): Prisma.InventoryItemWhereInput =>
  buildInventoryWhereInput({
    archiveState: filters.archiveState,
    category: filters.category,
    customerId: filters.customerId,
    includeArchived: false,
    lowStockState: filters.lowStockState,
    ownerId: filters.ownerId,
    q: filters.q,
    status: filters.status,
    workItemId: filters.workItemId,
  });

const workItemReportOrderBy = [
  { updatedAt: "desc" },
] satisfies Prisma.WorkItemOrderByWithRelationInput[];
const issueReportOrderBy = [
  { updatedAt: "desc" },
] satisfies Prisma.IssueOrderByWithRelationInput[];
const inventoryReportOrderBy = [
  { updatedAt: "desc" },
] satisfies Prisma.InventoryItemOrderByWithRelationInput[];
const activeOrBlockedOrderStatuses: WorkItemStatus[] = [
  WorkItemStatus.ACTIVE,
  WorkItemStatus.BLOCKED,
];

export type OrdersReportRecord = ReturnType<typeof toOrderApi>;
export type IssuesReportRecord = ReturnType<typeof toIssueApi>;
export type InventoryReportRecord = ReturnType<typeof toInventoryApi>;

export type OrdersReportData = {
  filters: OrdersReportQuery;
  metrics: {
    overdue: number;
    rows: number;
    totalValueCents: number;
  };
  report: "orders";
  rows: OrdersReportRecord[];
};

export type IssuesReportData = {
  filters: IssuesReportQuery;
  metrics: {
    highPriority: number;
    rows: number;
    unresolved: number;
  };
  report: "issues";
  rows: IssuesReportRecord[];
};

export type InventoryReportData = {
  filters: InventoryReportQuery;
  metrics: {
    lowStock: number;
    quantity: number;
    rows: number;
  };
  report: "inventory";
  rows: InventoryReportRecord[];
};

export type ReportData =
  | OrdersReportData
  | IssuesReportData
  | InventoryReportData;

const getOrdersReport = async (
  prisma: PrismaClient,
  filters: OrdersReportQuery,
  limit: number,
  referenceDate: Date,
  workspaceId: string,
): Promise<OrdersReportData> => {
  const orders = await prisma.workItem.findMany({
    orderBy: workItemReportOrderBy,
    select: orderSelect,
    take: limit,
    where: { AND: [{ workspaceId }, buildOrdersReportWhereInput(filters, referenceDate)] },
  });
  const rows = sortOrdersForList(orders, referenceDate).map((order) =>
    toOrderApi(order, referenceDate),
  );

  return {
    filters,
    metrics: {
      overdue: rows.filter((order) => order.isOverdue).length,
      rows: rows.length,
      totalValueCents: rows.reduce(
        (total, order) => total + (order.estimatedValueCents ?? 0),
        0,
      ),
    },
    report: "orders",
    rows,
  };
};

const highPriorityValues: Priority[] = [Priority.URGENT, Priority.HIGH];

const getIssuesReport = async (
  prisma: PrismaClient,
  filters: IssuesReportQuery,
  limit: number,
  workspaceId: string,
): Promise<IssuesReportData> => {
  const issues = await prisma.issue.findMany({
    orderBy: issueReportOrderBy,
    select: issueSelect,
    take: limit,
    where: { AND: [{ workspaceId }, buildIssuesReportWhereInput(filters)] },
  });
  const rows = sortIssuesForList(issues).map(toIssueApi);
  const unresolvedRows = rows.filter((issue) => !issue.isResolved);

  return {
    filters,
    metrics: {
      highPriority: unresolvedRows.filter((issue) =>
        highPriorityValues.includes(issue.priority),
      ).length,
      rows: rows.length,
      unresolved: unresolvedRows.length,
    },
    report: "issues",
    rows,
  };
};

const getInventoryReport = async (
  prisma: PrismaClient,
  filters: InventoryReportQuery,
  limit: number,
  workspaceId: string,
): Promise<InventoryReportData> => {
  const inventoryItems = await prisma.inventoryItem.findMany({
    orderBy: inventoryReportOrderBy,
    select: inventorySelect,
    take: limit,
    where: { AND: [{ workspaceId }, buildInventoryReportWhereInput(filters)] },
  });
  const rows = sortInventoryForList(
    filterInventoryByLowStockState(inventoryItems, filters.lowStockState),
  ).map(toInventoryApi);

  return {
    filters,
    metrics: {
      lowStock: rows.filter(isInventoryLowStock).length,
      quantity: rows.reduce((total, item) => total + item.quantity, 0),
      rows: rows.length,
    },
    report: "inventory",
    rows,
  };
};

export const getReportData = async (
  filters: ReportQuery,
  options: { limit?: number; referenceDate?: Date; workspaceId?: string } = {},
): Promise<ReportData> => {
  const prisma = getPrismaClient();
  const limit = options.limit ?? 250;
  const referenceDate = options.referenceDate ?? new Date();
  const workspaceId = options.workspaceId ?? (await requireSandboxWorkspaceId());

  if (filters.report === "issues") {
    return getIssuesReport(prisma, filters, limit, workspaceId);
  }

  if (filters.report === "inventory") {
    return getInventoryReport(prisma, filters, limit, workspaceId);
  }

  return getOrdersReport(prisma, filters, limit, referenceDate, workspaceId);
};

export const getReportFilterChoices = async (report: ReportType) => {
  const prisma = getPrismaClient();
  const workspaceId = await requireSandboxWorkspaceId();

  if (report === "issues") {
    const [customers, owners, workItems] = await Promise.all([
      listIssueCustomerChoices(prisma, workspaceId),
      listIssueOwnerChoices(prisma),
      listIssueWorkItemChoices(prisma, workspaceId),
    ]);

    return { customers, owners, workItems };
  }

  if (report === "inventory") {
    const [customers, owners, workItems] = await Promise.all([
      listInventoryCustomerChoices(prisma, workspaceId),
      listInventoryOwnerChoices(prisma),
      listInventoryWorkItemChoices(prisma, workspaceId),
    ]);

    return { customers, owners, workItems };
  }

  const [customers, owners] = await Promise.all([
    listOrderCustomerChoices(prisma, workspaceId),
    listOrderOwnerChoices(prisma),
  ]);

  return { customers, owners, workItems: [] };
};

export const getReportSummaryLabel = (report: ReportData) => {
  if (report.report === "orders") {
    const activeOrBlocked = report.rows.filter((order) =>
      activeOrBlockedOrderStatuses.includes(order.status),
    ).length;

    return `${activeOrBlocked} active or blocked, ${report.metrics.overdue} overdue`;
  }

  if (report.report === "issues") {
    return `${report.metrics.unresolved} unresolved, ${report.metrics.highPriority} high priority`;
  }

  const assignedOrReserved = report.rows.filter((item) =>
    ["ASSIGNED", "RESERVED"].includes(item.status),
  ).length;

  return `${report.metrics.lowStock} low stock, ${assignedOrReserved} assigned or reserved`;
};

export const isReportEmpty = (report: ReportData) => report.rows.length === 0;

export const isIssueResolved = (status: IssueStatus) =>
  isResolvedIssueStatus(status);

const appendSearchParam = (
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) => {
  if (value) {
    params.set(key, value);
  }
};

export const reportQueryToSearchParams = (filters: ReportQuery) => {
  const params = new URLSearchParams();

  params.set("report", filters.report);
  appendSearchParam(params, "q", filters.q);
  appendSearchParam(params, "archiveState", filters.archiveState);
  appendSearchParam(params, "customerId", filters.customerId);
  appendSearchParam(params, "ownerId", filters.ownerId);

  if (filters.report === "orders") {
    appendSearchParam(params, "dueDateBucket", filters.dueDateBucket);
    appendSearchParam(params, "dueFrom", filters.dueFrom);
    appendSearchParam(params, "dueTo", filters.dueTo);
    appendSearchParam(params, "kind", filters.kind);
    appendSearchParam(params, "priority", filters.priority);
    appendSearchParam(params, "status", filters.status);
  }

  if (filters.report === "issues") {
    appendSearchParam(params, "category", filters.category);
    appendSearchParam(params, "priority", filters.priority);
    appendSearchParam(params, "resolutionState", filters.resolutionState);
    appendSearchParam(params, "status", filters.status);
    appendSearchParam(params, "workItemId", filters.workItemId);
  }

  if (filters.report === "inventory") {
    appendSearchParam(params, "category", filters.category);
    appendSearchParam(params, "lowStockState", filters.lowStockState);
    appendSearchParam(params, "status", filters.status);
    appendSearchParam(params, "workItemId", filters.workItemId);
  }

  return params;
};
