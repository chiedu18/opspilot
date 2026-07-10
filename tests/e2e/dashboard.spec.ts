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
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/dashboard");

    await expect(
      page.getByRole("group", { name: "Active customers: 7" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Open orders: 15" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Overdue orders: 5" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "High-priority issues: 12" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Low-stock inventory: 4" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Completed this week: 6" }),
    ).toBeVisible();
    await expect(page.getByText("Completed work items")).toBeVisible();
    await expect(page.getByText("Resolved or closed issues")).toBeVisible();

    await expect(page.getByLabel("Draft work items: 2")).toBeVisible();
    await expect(page.getByLabel("Active work items: 10")).toBeVisible();
    await expect(page.getByLabel("Blocked work items: 3")).toBeVisible();
    await expect(page.getByLabel("Completed work items: 4")).toBeVisible();
    await expect(page.getByLabel("Cancelled work items: 1")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Overdue orders" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "View orders" }))
      .toHaveAttribute("href", "/orders?dueDateBucket=OVERDUE");
    await expect(
      page.getByRole("link", { name: "Donor campaign segmentation" }),
    ).toHaveAttribute("href", "/orders/work-bluepeak-donor-campaign");
    await expect(
      page.getByText("BluePeak Nonprofit Demo - Olivia Chen - Due Jul 1, 2026"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "High-priority issues" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "View issues" }))
      .toHaveAttribute("href", "/issues?resolutionState=UNRESOLVED");
    await expect(
      page.getByRole("link", { name: "Donor segment file blocked" }),
    ).toHaveAttribute("href", "/issues/issue-bluepeak-donor-segment");
    await expect(
      page.getByText(
        "BluePeak Nonprofit Demo - Olivia Chen - Updated Jul 7, 2026",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Low-stock inventory" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "View inventory" }))
      .toHaveAttribute("href", "/inventory?lowStockState=LOW_STOCK");
    await expect(
      page.getByRole("link", { name: "Barcode scanner pool" }),
    ).toHaveAttribute("href", "/inventory/inv-greenfield-barcode-scanners");
    await expect(page.getByText("1 on hand - Threshold 4")).toBeVisible();
    await expectNoPageWideOverflow(page);
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
