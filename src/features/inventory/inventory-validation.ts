import {
  InventoryCategory,
  InventoryStatus,
} from "@/generated/prisma/client";
import { z } from "zod";

import type {
  InventoryCategory as InventoryCategoryValue,
  InventoryStatus as InventoryStatusValue,
} from "@/generated/prisma/client";

const inventoryCategoryValues = Object.values(InventoryCategory) as [
  InventoryCategoryValue,
  ...InventoryCategoryValue[],
];

const inventoryStatusValues = Object.values(InventoryStatus) as [
  InventoryStatusValue,
  ...InventoryStatusValue[],
];

export const inventoryArchiveStateValues = ["WITHOUT", "WITH", "ONLY"] as const;
export const inventoryLowStockStateValues = ["LOW_STOCK", "OK"] as const;

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

const inventoryQuantitySchema = (label: string) =>
  z
    .number()
    .int(`${label} must be a whole number.`)
    .min(0, `${label} cannot be negative.`)
    .max(1_000_000, `${label} is too large.`);

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

export const inventoryCategorySchema = z.enum(inventoryCategoryValues);
export const inventoryStatusSchema = z.enum(inventoryStatusValues);
export const inventoryArchiveStateSchema = z.enum(inventoryArchiveStateValues);
export const inventoryLowStockStateSchema = z.enum(
  inventoryLowStockStateValues,
);

const inventoryEditableSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is required.")
    .max(160, "Name must be 160 characters or fewer."),
  category: inventoryCategorySchema,
  status: inventoryStatusSchema,
  quantity: inventoryQuantitySchema("Quantity"),
  lowStockThreshold: inventoryQuantitySchema("Low-stock threshold"),
  location: optionalNullableText(160, "Location"),
  referenceCode: optionalNullableText(80, "Reference code"),
  ownerId: optionalRelationId("Owner"),
  customerId: optionalRelationId("Customer"),
  workItemId: optionalRelationId("Order"),
  notes: optionalNullableText(2000, "Notes"),
});

export const inventoryCreateSchema = inventoryEditableSchema;

export const inventoryUpdateSchema = inventoryEditableSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one inventory field must be provided.",
  });

export const inventoryListQuerySchema = z.object({
  q: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Search must be 100 characters or fewer.").optional(),
  ),
  category: z.preprocess(
    blankStringToUndefined,
    inventoryCategorySchema.optional(),
  ),
  status: z.preprocess(blankStringToUndefined, inventoryStatusSchema.optional()),
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
  lowStockState: z.preprocess(
    blankStringToUndefined,
    inventoryLowStockStateSchema.optional(),
  ),
  archiveState: z
    .preprocess(blankStringToUndefined, inventoryArchiveStateSchema.optional())
    .default("WITHOUT"),
  includeArchived: queryBooleanSchema.default(false),
});

export type InventoryArchiveState = z.infer<
  typeof inventoryArchiveStateSchema
>;
export type InventoryLowStockState = z.infer<
  typeof inventoryLowStockStateSchema
>;
export type InventoryCreateInput = z.infer<typeof inventoryCreateSchema>;
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
