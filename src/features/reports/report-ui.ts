import {
  inventoryCategoryMeta,
  inventoryStatusMeta,
} from "@/features/inventory/inventory-ui";
import {
  issueCategoryMeta,
  issuePriorityMeta,
  issueStatusMeta,
} from "@/features/issues/issue-ui";
import {
  orderKindMeta,
  orderPriorityMeta,
  orderStatusMeta,
} from "@/features/orders/order-ui";

import type {
  ReportArchiveState,
  ReportDueDateBucket,
  ReportLowStockState,
  ReportResolutionState,
  ReportType,
} from "./report-validation";

export const reportTypeOptions = [
  {
    description: "Due dates, owners, priority, status, value, and risk.",
    label: "Orders",
    value: "orders",
  },
  {
    description: "QA/support status, priority, ownership, and resolution.",
    label: "Issues",
    value: "issues",
  },
  {
    description: "Stock levels, assignments, locations, and availability.",
    label: "Inventory",
    value: "inventory",
  },
] as const;

export const reportArchiveFilterOptions = [
  { label: "Active records", value: "WITHOUT" },
  { label: "Include archived", value: "WITH" },
  { label: "Archived only", value: "ONLY" },
] as const satisfies readonly {
  label: string;
  value: ReportArchiveState;
}[];

export const reportDueDateBucketOptions = [
  { label: "All due dates", value: "" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Due soon", value: "DUE_SOON" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "No due date", value: "NO_DUE_DATE" },
] as const satisfies readonly {
  label: string;
  value: "" | ReportDueDateBucket;
}[];

export const reportLowStockFilterOptions = [
  { label: "All stock states", value: "" },
  { label: "Low stock", value: "LOW_STOCK" },
  { label: "Stock ok", value: "OK" },
] as const satisfies readonly {
  label: string;
  value: "" | ReportLowStockState;
}[];

export const reportResolutionFilterOptions = [
  { label: "All resolution states", value: "" },
  { label: "Unresolved", value: "UNRESOLVED" },
  { label: "Resolved or closed", value: "RESOLVED" },
] as const satisfies readonly {
  label: string;
  value: "" | ReportResolutionState;
}[];

export const reportTypeMeta = (report: ReportType) =>
  reportTypeOptions.find((option) => option.value === report) ??
  reportTypeOptions[0];

export const formatReportDate = (
  date: Date | string | null | undefined,
) => {
  if (!date) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(date));
};

export const formatReportDateInput = (
  date: Date | string | null | undefined,
) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

export const formatReportCurrency = (
  estimatedValueCents: number | null | undefined,
) => {
  if (estimatedValueCents === null || estimatedValueCents === undefined) {
    return "Not estimated";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(estimatedValueCents / 100);
};

export const formatReportCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export const orderReportLabel = {
  kind: (value: string) => orderKindMeta(value).label,
  priority: (value: string) => orderPriorityMeta(value).label,
  status: (value: string) => orderStatusMeta(value).label,
};

export const issueReportLabel = {
  category: (value: string) => issueCategoryMeta(value).label,
  priority: (value: string) => issuePriorityMeta(value).label,
  status: (value: string) => issueStatusMeta(value).label,
};

export const inventoryReportLabel = {
  category: (value: string) => inventoryCategoryMeta(value).label,
  status: (value: string) => inventoryStatusMeta(value).label,
};
