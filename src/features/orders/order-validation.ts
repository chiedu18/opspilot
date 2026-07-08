import {
  Priority,
  WorkItemKind,
  WorkItemStatus,
} from "@/generated/prisma/client";
import { z } from "zod";

import type {
  Priority as PriorityValue,
  WorkItemKind as WorkItemKindValue,
  WorkItemStatus as WorkItemStatusValue,
} from "@/generated/prisma/client";

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

export const archiveStateValues = ["WITHOUT", "WITH", "ONLY"] as const;

export const dueDateBucketValues = [
  "OVERDUE",
  "DUE_SOON",
  "UPCOMING",
  "NO_DUE_DATE",
  "COMPLETED",
] as const;

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

const dateAtNoonUtc = (value: string) => {
  const trimmed = value.trim();
  const input = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T12:00:00.000Z`
    : trimmed;

  return new Date(input);
};

const requiredId = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(100, `${label} selection is invalid.`);

const optionalNullableText = (maxLength: number, label: string) =>
  z.preprocess(
    blankStringToNull,
    z
      .string()
      .max(maxLength, `${label} must be ${maxLength} characters or fewer.`)
      .nullable()
      .optional(),
  );

const dueDateSchema = z
  .any()
  .superRefine((value, context) => {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        context.addIssue({
          code: "custom",
          message: "Enter a valid due date.",
        });
      }

      return;
    }

    if (typeof value !== "string" || value.trim() === "") {
      context.addIssue({
        code: "custom",
        message: "Due date is required.",
      });
      return;
    }

    if (Number.isNaN(dateAtNoonUtc(value).getTime())) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid due date.",
      });
    }
  })
  .transform((value): Date => {
    if (value instanceof Date) {
      return value;
    }

    return typeof value === "string" ? dateAtNoonUtc(value) : new Date(NaN);
  });

const optionalEstimatedValueCents = z.preprocess(
  blankStringToNull,
  z
    .number()
    .int("Estimated value must be a whole number of cents.")
    .min(0, "Estimated value cannot be negative.")
    .max(100_000_000_000, "Estimated value is too large.")
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

export const orderKindSchema = z.enum(workItemKindValues);
export const orderPrioritySchema = z.enum(priorityValues);
export const orderStatusSchema = z.enum(workItemStatusValues);
export const archiveStateSchema = z.enum(archiveStateValues);
export const dueDateBucketSchema = z.enum(dueDateBucketValues);

const orderEditableSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is required.")
    .max(160, "Title must be 160 characters or fewer."),
  kind: orderKindSchema,
  status: orderStatusSchema,
  priority: orderPrioritySchema,
  dueDate: dueDateSchema,
  estimatedValueCents: optionalEstimatedValueCents,
  customerId: requiredId("Customer"),
  ownerId: requiredId("Owner"),
  notes: optionalNullableText(2000, "Notes"),
});

export const orderCreateSchema = orderEditableSchema;

export const orderUpdateSchema = orderEditableSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one order field must be provided.",
  });

export const orderListQuerySchema = z.object({
  q: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Search must be 100 characters or fewer.").optional(),
  ),
  kind: z.preprocess(blankStringToUndefined, orderKindSchema.optional()),
  status: z.preprocess(blankStringToUndefined, orderStatusSchema.optional()),
  priority: z.preprocess(blankStringToUndefined, orderPrioritySchema.optional()),
  customerId: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Customer filter is invalid.").optional(),
  ),
  ownerId: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Owner filter is invalid.").optional(),
  ),
  dueDateBucket: z.preprocess(
    blankStringToUndefined,
    dueDateBucketSchema.optional(),
  ),
  archiveState: z
    .preprocess(blankStringToUndefined, archiveStateSchema.optional())
    .default("WITHOUT"),
  includeArchived: queryBooleanSchema.default(false),
});

export type ArchiveState = z.infer<typeof archiveStateSchema>;
export type DueDateBucket = z.infer<typeof dueDateBucketSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
