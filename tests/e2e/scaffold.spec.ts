import { expect, test } from "@playwright/test";

import { signInAsDemoUser } from "./helpers/auth";

async function expectNoPageWideOverflow(page: import("@playwright/test").Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 2;
  });

  expect(hasOverflow).toBe(false);
}

test.describe("scaffold routes", () => {
  test("redirects the root route to the dashboard", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { exact: true, name: "Command center" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Active customers: 7" }),
    ).toBeVisible();
    await expect(page.getByLabel("Work items by status")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Overdue orders" }),
    ).toBeVisible();
  });

  test("marks the current app section in the navigation", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("link", { name: "Customers" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByRole("link", { name: "Customers" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      page.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current", "page");
  });

  test("renders customers as the first connected workflow", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/customers");

    await expect(
      page.getByRole("heading", { exact: true, name: "Customers" }),
    ).toBeVisible();
    await expect(page.getByText("Northstar Outfitters Demo")).toBeVisible();
    await expect(page.getByRole("link", { name: "New customer" })).toBeVisible();
  });

  test("renders orders as a connected workflow", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/orders");

    await expect(
      page.getByRole("heading", { exact: true, name: "Orders" }),
    ).toBeVisible();
    await expect(page.getByText("POS device rollout")).toBeVisible();
    await expect(page.getByRole("link", { name: "New order" })).toBeVisible();
  });

  test("renders inventory as a connected workflow", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/inventory");

    await expect(
      page.getByRole("heading", { exact: true, name: "Inventory" }),
    ).toBeVisible();
    await expect(page.getByText("Barcode scanner pool")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "New inventory item" }),
    ).toBeVisible();
  });

  test("renders issues as a connected workflow", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/issues");

    await expect(
      page.getByRole("heading", { exact: true, name: "Issues" }),
    ).toBeVisible();
    await expect(page.getByText("Device shipment delay")).toBeVisible();
    await expect(page.getByRole("link", { name: "New issue" })).toBeVisible();
  });

  test("renders reports as a connected workflow", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/reports");

    await expect(
      page.getByRole("heading", { exact: true, name: "Reports" }),
    ).toBeVisible();
    await expect(page.getByText("Orders report filters")).toBeVisible();
    await expect(page.getByText("POS device rollout")).toBeVisible();
    await expect(page.getByRole("link", { name: "Export CSV" })).toBeVisible();
  });

  test("keeps dashboard and module routes within the mobile viewport", async ({
    page,
  }) => {
    await signInAsDemoUser(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/dashboard");
    await expectNoPageWideOverflow(page);

    await page.goto("/customers");
    await expectNoPageWideOverflow(page);

    await page.goto("/orders");
    await expectNoPageWideOverflow(page);

    await page.goto("/inventory");
    await expectNoPageWideOverflow(page);

    await page.goto("/issues");
    await expectNoPageWideOverflow(page);

    await page.goto("/reports");
    await expectNoPageWideOverflow(page);
  });
});
