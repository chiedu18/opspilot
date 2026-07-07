import { expect, type Page } from "@playwright/test";

import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
} from "../../../src/lib/auth/demo-account";

export const signInAsDemoUser = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO_LOGIN_EMAIL);
  await page.getByLabel("Password").fill(DEMO_LOGIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Signed in as")).toBeVisible();
};
