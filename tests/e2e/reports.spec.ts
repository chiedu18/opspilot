import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { signInAsDemoUser } from "./helpers/auth";

async function expectNoPageWideOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 2;
  });

  expect(hasOverflow).toBe(false);
}

test.describe("reports workflow", () => {
  test("filters the orders report and exports the filtered CSV", async ({
    page,
  }) => {
    await signInAsDemoUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/reports");

    await expect(
      page.getByRole("heading", { exact: true, name: "Reports" }),
    ).toBeVisible();
    await expect(page.getByText("Orders report filters")).toBeVisible();
    await expect(page.getByText("POS device rollout")).toBeVisible();

    await page.getByLabel("Status").selectOption("BLOCKED");
    await page.getByLabel("Priority").selectOption("HIGH");
    await page.getByLabel("Kind").selectOption("SERVICE_REQUEST");
    await page.getByLabel("Due date").selectOption("OVERDUE");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/status=BLOCKED/);
    await expect(page.getByText("Patient reminder workflow")).toBeVisible();
    await expect(page.getByText("POS device rollout")).toHaveCount(0);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(download.suggestedFilename()).toMatch(
      /^opspilot-orders-report-\d{4}-\d{2}-\d{2}-\d+-rows\.csv$/,
    );
    expect(downloadPath).toBeTruthy();

    const csv = await readFile(downloadPath!, "utf8");

    expect(csv).toContain(
      "Work item,Kind,Status,Priority,Customer,Owner,Due date",
    );
    expect(csv).toContain("Patient reminder workflow");
    expect(csv).toContain("Service request,Blocked,High");
    expect(csv).not.toContain("POS device rollout");
    await expectNoPageWideOverflow(page);
  });
});
