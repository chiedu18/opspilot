import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { signInAsDemoUser } from "./helpers/auth";

const demoRoutes = [
  { heading: "Dashboard", path: "/dashboard" },
  { heading: "Customers", path: "/customers" },
  { heading: "Orders", path: "/orders" },
  { heading: "Inventory", path: "/inventory" },
  { heading: "Issues", path: "/issues" },
  { heading: "Reports", path: "/reports" },
] as const;

const responsiveViewports = [
  { height: 900, label: "desktop", width: 1440 },
  { height: 1180, label: "tablet", width: 820 },
  { height: 844, label: "mobile", width: 390 },
] as const;

async function expectNoPageWideOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 2;
  });

  expect(hasOverflow).toBe(false);
}

test.describe("core demo regression", () => {
  test("walks the main read-only demo path and exports a report", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    await page.goto("/dashboard");
    await expect(
      page.getByRole("group", { name: "Open orders: 15" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "High-priority issues" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Customers" }).click();
    await expect(
      page.getByRole("heading", { exact: true, name: "Customers" }),
    ).toBeVisible();
    await page
      .getByRole("link", { exact: true, name: "Northstar Outfitters Demo" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Northstar Outfitters Demo" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Orders" }).click();
    await expect(
      page.getByRole("heading", { exact: true, name: "Orders" }),
    ).toBeVisible();
    await page
      .getByRole("link", { exact: true, name: "POS device rollout" })
      .click();
    await expect(
      page.getByRole("heading", { name: "POS device rollout" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Inventory" }).click();
    await expect(
      page.getByRole("heading", { exact: true, name: "Inventory" }),
    ).toBeVisible();
    await page
      .getByRole("link", { exact: true, name: "Barcode scanner pool" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Barcode scanner pool" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Issues" }).click();
    await expect(
      page.getByRole("heading", { exact: true, name: "Issues" }),
    ).toBeVisible();
    await page
      .getByRole("link", { exact: true, name: "Device shipment delay" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Device shipment delay" }),
    ).toBeVisible();

    await page.goto("/reports?report=orders&q=Northstar");
    await expect(page.getByText("Orders report filters")).toBeVisible();
    await expect(page.getByText("POS device rollout")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    const csv = await readFile(downloadPath!, "utf8");

    expect(csv).toContain("Work item,Kind,Status,Priority,Customer");
    expect(csv).toContain("Northstar Outfitters Demo");
    expect(csv).toContain("POS device rollout");
  });

  test("keeps main demo routes inside desktop, tablet, and mobile viewports", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    for (const viewport of responsiveViewports) {
      await page.setViewportSize({
        height: viewport.height,
        width: viewport.width,
      });

      for (const route of demoRoutes) {
        await page.goto(route.path);
        await expect(
          page.getByRole("heading", { exact: true, name: route.heading }),
        ).toBeVisible();
        await expectNoPageWideOverflow(page);
      }
    }
  });

  test("keeps primary forms labeled with named actions", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/customers/new");
    await expect(page.getByLabel("Customer name")).toBeVisible();
    await expect(page.getByLabel("Contact name")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create customer" }),
    ).toBeVisible();

    await page.goto("/orders/new");
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByLabel("Due date")).toBeVisible();
    await expect(page.getByLabel("Customer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create order" }))
      .toBeVisible();

    await page.goto("/inventory/new");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Quantity")).toBeVisible();
    await expect(page.getByLabel("Low-stock threshold")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create inventory item" }),
    ).toBeVisible();

    await page.goto("/issues/new");
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    await expect(page.getByLabel("Resolution notes")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create issue" }))
      .toBeVisible();
  });
});
