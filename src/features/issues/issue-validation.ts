import {
  IssueCategory,
  IssueStatus,
  Priority,
} from "@/generated/prisma/client";
import { z } from "zod";

import type {
  IssueCategory as IssueCategoryValue,
  IssueStatus as IssueStatusValue,
  Priority as PriorityValue,
} from "@/generated/prisma/client";

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

export const issueArchiveStateValues = ["WITHOUT", "WITH", "ONLY"] as const;
export const issueResolutionStateValues = [
  "UNRESOLVED",
  "RESOLVED",
] as const;

const resolvedStatuses: IssueStatusValue[] = [
  IssueStatus.RESOLVED,
  IssueStatus.CLOSED,
];

const blankStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const blankStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const requiredId = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(100, `${label} selection is invalid.`);

const optionalRelationId = (label: string) =>
  z.preprocess(
    blankStringToNull,
    z
      .string()
      .trim()
      .min(1, `${label} selection is invalid.`)
      .max(100, `${label} selection is invalid.`)
      .nullable()
      .optional(),
  );

const optionalNullableText = (maxLength: number, label: string) =>
  z.preprocess(
    blankStringToNull,
    z
      .string()
      .trim()
      .max(maxLength, `${label} must be ${maxLength} characters or fewer.`)
      .nullable()
      .optional(),
  );

const queryBooleanSchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return false;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return value;
}, z.boolean());

const hasResolutionNotes = (value: string | null | undefined) =>
  Boolean(value?.trim());

export const issueCategorySchema = z.enum(issueCategoryValues);
export const issueStatusSchema = z.enum(issueStatusValues);
export const issuePrioritySchema = z.enum(priorityValues);
export const issueArchiveStateSchema = z.enum(issueArchiveStateValues);
export const issueResolutionStateSchema = z.enum(
  issueResolutionStateValues,
);

const issueEditableSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is required.")
    .max(180, "Title must be 180 characters or fewer."),
  category: issueCategorySchema,
  priority: issuePrioritySchema,
  status: issueStatusSchema,
  ownerId: requiredId("Owner"),
  customerId: optionalRelationId("Customer"),
  workItemId: optionalRelationId("Order"),
  description: z
    .string()
    .trim()
    .min(2, "Description is required.")
    .max(4000, "Description must be 4000 characters or fewer."),
  resolutionNotes: optionalNullableText(4000, "Resolution notes"),
});

export const issueCreateSchema = issueEditableSchema.superRefine(
  (value, context) => {
    if (
      resolvedStatuses.includes(value.status) &&
      !hasResolutionNotes(value.resolutionNotes)
    ) {
      context.addIssue({
        code: "custom",
        message: "Resolution notes are required when resolving or closing an issue.",
        path: ["resolutionNotes"],
      });
    }
  },
);

export const issueUpdateSchema = issueEditableSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one issue field must be provided.",
  });

export const issueListQuerySchema = z.object({
  q: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Search must be 100 characters or fewer.").optional(),
  ),
  category: z.preprocess(
    blankStringToUndefined,
    issueCategorySchema.optional(),
  ),
  priority: z.preprocess(
    blankStringToUndefined,
    issuePrioritySchema.optional(),
  ),
  status: z.preprocess(blankStringToUndefined, issueStatusSchema.optional()),
  customerId: z.preprocess(
    blankStringToUndefined,
    z.string().trim().max(100, "Customer filter is invalid.").optional(),
  ),
  workItemId: z.preprocess(
    blankStringToUndefined,
    z.string().trim().max(100, "Order filter is invalid.").optional(),
  ),
  ownerId: z.preprocess(
    blankStringToUndefined,
    z.string().trim().max(100, "Owner filter is invalid.").optional(),
  ),
  resolutionState: z.preprocess(
    blankStringToUndefined,
    issueResolutionStateSchema.optional(),
  ),
  archiveState: z
    .preprocess(blankStringToUndefined, issueArchiveStateSchema.optional())
    .default("WITHOUT"),
  includeArchived: queryBooleanSchema.default(false),
});

export type IssueArchiveState = z.infer<typeof issueArchiveStateSchema>;
export type IssueResolutionState = z.infer<
  typeof issueResolutionStateSchema
>;
export type IssueCreateInput = z.infer<typeof issueCreateSchema>;
export type IssueUpdateInput = z.infer<typeof issueUpdateSchema>;
export type IssueListQuery = z.infer<typeof issueListQuerySchema>;
