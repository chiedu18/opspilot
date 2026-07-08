import { CustomerStatus } from "@/generated/prisma/client";
import { z } from "zod";

import type { CustomerStatus as CustomerStatusValue } from "@/generated/prisma/client";

const customerStatusValues = Object.values(CustomerStatus) as [
  CustomerStatusValue,
  ...CustomerStatusValue[],
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

const optionalNullableText = (maxLength: number, label: string) =>
  z.preprocess(
    blankStringToNull,
    z
      .string()
      .max(maxLength, `${label} must be ${maxLength} characters or fewer.`)
      .nullable()
      .optional(),
  );

const optionalNullableEmail = z.preprocess(
  blankStringToNull,
  z
    .string()
    .email("Enter a valid email address.")
    .max(254, "Email must be 254 characters or fewer.")
    .nullable()
    .optional(),
);

const optionalOwnerId = z.preprocess(
  blankStringToNull,
  z
    .string()
    .max(100, "Owner selection is invalid.")
    .nullable()
    .optional(),
);

export const customerStatusSchema = z.enum(customerStatusValues);

const customerEditableSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Customer name is required.")
    .max(120, "Customer name must be 120 characters or fewer."),
  contactName: z
    .string()
    .trim()
    .min(2, "Contact name is required.")
    .max(120, "Contact name must be 120 characters or fewer."),
  email: optionalNullableEmail,
  phone: optionalNullableText(40, "Phone"),
  status: customerStatusSchema,
  ownerId: optionalOwnerId,
  notes: optionalNullableText(2000, "Notes"),
});

export const customerCreateSchema = customerEditableSchema.extend({
  status: customerStatusSchema.default(CustomerStatus.PROSPECT),
});

export const customerUpdateSchema = customerEditableSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one customer field must be provided.",
  });

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

export const customerListQuerySchema = z.object({
  q: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Search must be 100 characters or fewer.").optional(),
  ),
  status: z.preprocess(blankStringToUndefined, customerStatusSchema.optional()),
  ownerId: z.preprocess(
    blankStringToUndefined,
    z.string().max(100, "Owner filter is invalid.").optional(),
  ),
  includeArchived: queryBooleanSchema.default(false),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
