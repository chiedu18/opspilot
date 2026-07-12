import { describe, expect, it } from "vitest";

import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
  DEMO_SESSION_MAX_AGE_SECONDS,
  validateDemoCredentials,
} from "../../src/lib/auth/demo-account";

describe("demo auth helpers", () => {
  it("accepts the seeded demo manager credentials", () => {
    expect(
      validateDemoCredentials({
        email: DEMO_LOGIN_EMAIL,
        password: DEMO_LOGIN_PASSWORD,
      }),
    ).toBe(true);
  });

  it("treats the demo email comparison as case-insensitive", () => {
    expect(
      validateDemoCredentials({
        email: DEMO_LOGIN_EMAIL.toUpperCase(),
        password: DEMO_LOGIN_PASSWORD,
      }),
    ).toBe(true);
  });

  it("rejects incorrect demo credentials", () => {
    expect(
      validateDemoCredentials({
        email: DEMO_LOGIN_EMAIL,
        password: "wrong-password",
      }),
    ).toBe(false);
  });

  it("uses a 24-hour lifetime for isolated demo sessions", () => {
    expect(DEMO_SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24);
  });
});
