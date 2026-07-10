import {
  InventoryCategory,
  InventoryStatus,
  IssueCategory,
  IssueStatus,
  Priority,
  WorkItemKind,
  WorkItemStatus,
} from "@/generated/prisma/client";
import { z } from "zod";

import type {
  InventoryCategory as InventoryCategoryValue,
  InventoryStatus as InventoryStatusValue,
  IssueCategory as IssueCategoryValue,
  IssueStatus as IssueStatusValue,
  Priority as PriorityValue,
  WorkItemKind as WorkItemKindValue,
  WorkItemStatus as WorkItemStatusValue,
} from "@/generated/prisma/client";

export const reportTypes = ["orders", "issues", "inventory"] as const;
export const reportArchiveStateValues = ["WITHOUT", "WITH", "ONLY"] as const;
export const reportDueDateBucketValues = [
  "OVERDUE",
  "DUE_SOON",
  "UPCOMING",
  "NO_DUE_DATE",
  "COMPLETED",
] as const;
export const reportLowStockStateValues = ["LOW_STOCK", "OK"] as const;
export const reportResolutionStateValues = [
  "UNRESOLVED",
  "RESOLVED",
] as const;

const inventoryCategoryValues = Object.values(InventoryCategory) as [
  InventoryCategoryValue,
  ...InventoryCategoryValue[],
];
const inventoryStatusValues = Object.values(InventoryStatus) as [
  InventoryStatusValue,
  ...InventoryStatusValue[],
];
const issueCategoryValues = Object.values(IssueCategory) as [
  IssueCategoryValue,
  ...IssueCategoryValue[],
];
const issueStatusValues = Object.values(IssueStatus) as [
  IssueStatusValue,
  ...IssueStatusValue[],
];
const priorityValues = Object.values(Priority) as [
  PriorityValue,
  ...PriorityValue[],
];
const workItemKindValues = Object.values(WorkItemKind) as [
  WorkItemKindValue,
  ...WorkItemKindValue[],
];
const workItemStatusValues = Object.values(WorkItemStatus) as [
  WorkItemStatusValue,
  ...WorkItemStatusValue[],
];

const blankStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

const optionalSearch = z.preprocess(
  blankStringToUndefined,
  z.string().max(100, "Search must be 100 characters or fewer.").optional(),
);

const optionalRelationFilter = (label: string) =>
  z.preprocess(
    blankStringToUndefined,
    z.string().trim().max(100, `${label} filter is invalid.`).optional(),
  );

const dateFilterSchema = (label: string) =>
  z.preprocess(
    blankStringToUndefined,
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must use YYYY-MM-DD.`)
      .optional(),
  );

export const reportTypeSchema = z.enum(reportTypes);
export const reportArchiveStateSchema = z.enum(reportArchiveStateValues);
export const reportDueDateBucketSchema = z.enum(reportDueDateBucketValues);
export const reportLowStockStateSchema = z.enum(reportLowStockStateValues);
export const reportResolutionStateSchema = z.enum(reportResolutionStateValues);

const baseReportSchema = {
  archiveState: z
    .preprocess(blankStringToUndefined, reportArchiveStateSchema.optional())
    .default("WITHOUT"),
  customerId: optionalRelationFilter("Customer"),
  ownerId: optionalRelationFilter("Owner"),
  q: optionalSearch,
};

export const ordersReportQuerySchema = z
  .object({
    ...baseReportSchema,
    dueDateBucket: z.preprocess(
      blankStringToUndefined,
      reportDueDateBucketSchema.optional(),
    ),
    dueFrom: dateFilterSchema("Due from"),
    dueTo: dateFilterSchema("Due to"),
    kind: z.preprocess(
      blankStringToUndefined,
      z.enum(workItemKindValues).optional(),
    ),
    priority: z.preprocess(
      blankStringToUndefined,
      z.enum(priorityValues).optional(),
    ),
    report: z.literal("orders").default("orders"),
    status: z.preprocess(
      blankStringToUndefined,
      z.enum(workItemStatusValues).optional(),
    ),
  })
  .refine(
    (value) =>
      !value.dueFrom ||
      !value.dueTo ||
      value.dueFrom <= value.dueTo,
    {
      message: "Due from must be before due to.",
      path: ["dueFrom"],
    },
  );

export const issuesReportQuerySchema = z.object({
  ...baseReportSchema,
  category: z.preprocess(
    blankStringToUndefined,
    z.enum(issueCategoryValues).optional(),
  ),
  priority: z.preprocess(
    blankStringToUndefined,
    z.enum(priorityValues).optional(),
  ),
  report: z.literal("issues"),
  resolutionState: z.preprocess(
    blankStringToUndefined,
    reportResolutionStateSchema.optional(),
  ),
  status: z.preprocess(
    blankStringToUndefined,
    z.enum(issueStatusValues).optional(),
  ),
  workItemId: optionalRelationFilter("Order"),
});

export const inventoryReportQuerySchema = z.object({
  ...baseReportSchema,
  category: z.preprocess(
    blankStringToUndefined,
    z.enum(inventoryCategoryValues).optional(),
  ),
  lowStockState: z.preprocess(
    blankStringToUndefined,
    reportLowStockStateSchema.optional(),
  ),
  report: z.literal("inventory"),
  status: z.preprocess(
    blankStringToUndefined,
    z.enum(inventoryStatusValues).optional(),
  ),
  workItemId: optionalRelationFilter("Order"),
});

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportArchiveState = z.infer<typeof reportArchiveStateSchema>;
export type ReportDueDateBucket = z.infer<typeof reportDueDateBucketSchema>;
export type ReportLowStockState = z.infer<typeof reportLowStockStateSchema>;
export type ReportResolutionState = z.infer<typeof reportResolutionStateSchema>;
export type OrdersReportQuery = z.infer<typeof ordersReportQuerySchema>;
export type IssuesReportQuery = z.infer<typeof issuesReportQuerySchema>;
export type InventoryReportQuery = z.infer<typeof inventoryReportQuerySchema>;
export type ReportQuery =
  | OrdersReportQuery
  | IssuesReportQuery
  | InventoryReportQuery;
