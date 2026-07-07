import { describe, expect, it } from "vitest";

import { getRequestOrigin, getSameOriginUrl } from "../../src/lib/http/redirects";

describe("redirect helpers", () => {
  it("prefers forwarded deployment headers when present", () => {
    const request = new Request("http://localhost:3000/login", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "opspilot.example.test",
        "x-forwarded-proto": "https",
      },
    });

    expect(getRequestOrigin(request)).toBe("https://opspilot.example.test");
  });

  it("uses the incoming host header for local same-origin redirects", () => {
    const request = new Request("http://localhost:3000/api/session", {
      headers: {
        host: "127.0.0.1:3000",
      },
    });

    expect(getSameOriginUrl(request, "/dashboard").toString()).toBe(
      "http://127.0.0.1:3000/dashboard",
    );
  });
});
