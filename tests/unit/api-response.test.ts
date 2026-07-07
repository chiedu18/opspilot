import { describe, expect, it } from "vitest";

import { apiError, apiOk } from "../../src/lib/api/responses";

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
});
