import { expect, test } from "@playwright/test";

import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
} from "../../src/lib/auth/demo-account";
import { signInAsDemoUser } from "./helpers/auth";

test.describe("demo auth", () => {
  test("redirects protected app routes to login without a session", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "OpsPilot demo workspace" }),
    ).toBeVisible();
  });

  test("signs in with the seeded demo credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_LOGIN_EMAIL);
    await page.getByLabel("Password").fill(DEMO_LOGIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { exact: true, name: "Command center" }),
    ).toBeVisible();
    await expect(page.getByText("Signed in as Olivia Chen")).toBeVisible();
  });

  test("redirects signed-in demo users away from login", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/login");

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("signs out and protects the app routes again", async ({ page }) => {
    await signInAsDemoUser(page);
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/customers");

    await expect(page).toHaveURL(/\/login$/);
  });
});
