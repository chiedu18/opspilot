import { expect, test, type Page } from "@playwright/test";

import { signInAsDemoUser } from "./helpers/auth";

async function expectNoPageWideOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 2;
  });

  expect(hasOverflow).toBe(false);
}

test.describe("dashboard", () => {
  test("renders real metrics, chart buckets, and urgent work panels", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    await page.goto("/dashboard");

    await expect(
      page.getByRole("group", { name: "Active customers: 7" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Open orders: 15" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "High-priority issues: 12" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Low-stock inventory: 4" }),
    ).toBeVisible();
    await expect(page.getByLabel("Active work items: 10")).toBeVisible();
    await expect(page.getByLabel("Blocked work items: 3")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Overdue orders" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Donor campaign segmentation" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "High-priority issues" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Donor segment file blocked" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Low-stock inventory" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Barcode scanner pool" }),
    ).toBeVisible();
  });

  test("keeps the dashboard within the mobile viewport", async ({ page }) => {
    await signInAsDemoUser(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/dashboard");

    await expect(
      page.getByRole("group", { name: "Active customers: 7" }),
    ).toBeVisible();
    await expect(page.getByLabel("Work items by status")).toBeVisible();
    await expectNoPageWideOverflow(page);
  });
});
