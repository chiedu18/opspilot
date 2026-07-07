import { describe, expect, it } from "vitest";

import {
  apiError,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiValidationError,
} from "../../src/lib/api/responses";

describe("API response helpers", () => {
  it("wraps successful route data in a data object", async () => {
    const response = apiOk({ status: "ok" });

    await expect(response.json()).resolves.toEqual({
      data: { status: "ok" },
    });
    expect(response.status).toBe(200);
  });

  it("returns a stable error envelope and status code", async () => {
    const response = apiError("NOT_FOUND", "Record not found.", {
      status: 404,
    });

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Record not found.",
      },
    });
    expect(response.status).toBe(404);
  });

  it("includes validation details in a field-level error envelope", async () => {
    const response = apiValidationError({
      fieldErrors: {
        email: ["Enter a valid email address."],
      },
      formErrors: [],
    });

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        details: {
          fieldErrors: {
            email: ["Enter a valid email address."],
          },
          formErrors: [],
        },
        message: "Please check the highlighted fields.",
      },
    });
    expect(response.status).toBe(400);
  });

  it("returns the standard not-found response", async () => {
    const response = apiNotFound("Customer");

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Customer was not found.",
      },
    });
    expect(response.status).toBe(404);
  });

  it("returns a safe internal-error response", async () => {
    const response = apiInternalError();

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
    expect(response.status).toBe(500);
  });
});
