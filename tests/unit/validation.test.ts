import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  formatZodError,
  validateInput,
  validateJsonBody,
} from "../../src/lib/validation/request";

describe("validation helpers", () => {
  const customerDraftSchema = z.object({
    contact: z.object({
      email: z.email("Enter a valid email address."),
    }),
    name: z.string().min(2, "Name must be at least 2 characters."),
  });

  it("returns typed parsed data for valid input", () => {
    const result = validateInput(customerDraftSchema, {
      contact: { email: "ops@example.test" },
      name: "Demo Account",
    });

    expect(result).toEqual({
      success: true,
      data: {
        contact: { email: "ops@example.test" },
        name: "Demo Account",
      },
    });
  });

  it("maps Zod issues to stable field-level errors", () => {
    const result = validateInput(customerDraftSchema, {
      contact: { email: "not-an-email" },
      name: "",
    });

    expect(result).toEqual({
      success: false,
      details: {
        fieldErrors: {
          "contact.email": ["Enter a valid email address."],
          name: ["Name must be at least 2 characters."],
        },
        formErrors: [],
      },
    });
  });

  it("keeps root validation issues as form errors", () => {
    const dateRangeSchema = z
      .object({
        end: z.number(),
        start: z.number(),
      })
      .refine(({ end, start }) => end >= start, {
        message: "End must be after start.",
      });

    const result = dateRangeSchema.safeParse({ end: 1, start: 2 });

    if (result.success) {
      throw new Error("Expected test schema to fail.");
    }

    expect(formatZodError(result.error)).toEqual({
      fieldErrors: {},
      formErrors: ["End must be after start."],
    });
  });

  it("returns a form error for malformed JSON request bodies", async () => {
    const request = new Request("https://opspilot.test/api/customers", {
      body: "{",
      method: "POST",
    });

    await expect(validateJsonBody(request, customerDraftSchema)).resolves.toEqual(
      {
        success: false,
        details: {
          fieldErrors: {},
          formErrors: ["Request body must be valid JSON."],
        },
      },
    );
  });
});
