import { describe, expect, it } from "vitest";

import { CustomerStatus } from "../../src/generated/prisma/client";
import {
  customerCreateSchema,
  customerListQuerySchema,
  customerUpdateSchema,
} from "../../src/features/customers/customer-validation";

describe("customer validation", () => {
  it("trims customer input and defaults new customers to prospect", () => {
    const result = customerCreateSchema.parse({
      name: "  Acme Demo  ",
      contactName: "  Jordan Lee  ",
      email: "",
      phone: "  555-0199  ",
      notes: "",
    });

    expect(result).toEqual({
      name: "Acme Demo",
      contactName: "Jordan Lee",
      email: null,
      phone: "555-0199",
      status: CustomerStatus.PROSPECT,
      notes: null,
    });
  });

  it("rejects missing required customer fields", () => {
    const result = customerCreateSchema.safeParse({
      name: "",
      contactName: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        "Customer name is required.",
      );
      expect(result.error.flatten().fieldErrors.contactName).toContain(
        "Contact name is required.",
      );
    }
  });

  it("rejects invalid customer email addresses", () => {
    const result = customerCreateSchema.safeParse({
      name: "Acme Demo",
      contactName: "Jordan Lee",
      email: "not-an-email",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "Enter a valid email address.",
      );
    }
  });

  it("allows partial updates without adding create defaults", () => {
    const result = customerUpdateSchema.parse({
      notes: "  Updated account note.  ",
    });

    expect(result).toEqual({
      notes: "Updated account note.",
    });
  });

  it("rejects empty customer updates", () => {
    const result = customerUpdateSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().formErrors).toContain(
        "At least one customer field must be provided.",
      );
    }
  });

  it("parses customer list filters", () => {
    const result = customerListQuerySchema.parse({
      includeArchived: "true",
      ownerId: " team-olivia-chen ",
      q: " northstar ",
      status: CustomerStatus.ACTIVE,
    });

    expect(result).toEqual({
      includeArchived: true,
      ownerId: "team-olivia-chen",
      q: "northstar",
      status: CustomerStatus.ACTIVE,
    });
  });
});
