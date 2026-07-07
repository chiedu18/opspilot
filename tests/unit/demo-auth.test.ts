import { describe, expect, it } from "vitest";

import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
  DEMO_SESSION_COOKIE_VALUE,
  getDemoSessionFromCookieValue,
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

  it("creates a demo session only for the expected cookie value", () => {
    expect(getDemoSessionFromCookieValue(DEMO_SESSION_COOKIE_VALUE)).toEqual({
      user: {
        email: DEMO_LOGIN_EMAIL,
        id: "team-olivia-chen",
        name: "Olivia Chen",
        role: "Operations Manager",
      },
    });
    expect(getDemoSessionFromCookieValue("invalid")).toBeNull();
    expect(getDemoSessionFromCookieValue(undefined)).toBeNull();
  });
});
