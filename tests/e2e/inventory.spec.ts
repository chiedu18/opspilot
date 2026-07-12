import "./helpers/load-env";

import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { signInAsDemoUser } from "./helpers/auth";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for inventory browser tests.");
}

const pool = new Pool({ connectionString: databaseUrl });

const testInventory = {
  location: "Playwright QA shelf",
  name: "Playwright Inventory Demo",
  notes: "Demo test inventory item created by the browser workflow.",
  referenceCode: "PLAY-INV-001",
  updatedNotes: "Demo test inventory item updated by the browser workflow.",
};

const workflowNavigationTimeout = 15_000;

const deleteTestInventory = async () => {
  await pool.query("DELETE FROM inventory_items WHERE reference_code = $1", [
    testInventory.referenceCode,
  ]);
};

test.describe.serial("inventory workflow", () => {
  test.setTimeout(75_000);

  test.beforeAll(async () => {
    await deleteTestInventory();
  });

  test.afterAll(async () => {
    await deleteTestInventory();
    await pool.end();
  });

  test("creates, filters, edits, views, and archives an inventory item", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    await page.goto("/inventory");
    await expect(
      page.getByRole("heading", { exact: true, name: "Inventory" }),
    ).toBeVisible();
    await expect(page.getByText("Barcode scanner pool")).toBeVisible();
    await expect(page.getByText("Inventory and asset records")).toBeVisible();
    await expect(page.getByText("Retired router batch")).toHaveCount(0);

    await page.getByLabel("Search").fill("Northstar");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Northstar router kit")).toBeVisible();
    await expect(page.getByText("Wireless test phone pool")).toHaveCount(0);

    await page.goto("/inventory");
    await expect(page).toHaveURL(/\/inventory$/);
    await page.getByLabel("Category").selectOption("EQUIPMENT");
    await page.getByLabel("Status").selectOption("LOW_STOCK");
    await page
      .getByLabel("Customer")
      .selectOption({ label: "Greenfield Market Demo" });
    await page
      .getByLabel("Related order")
      .selectOption({ label: "SKU cleanup and barcode check - Greenfield Market Demo" });
    await page.getByLabel("Owner").selectOption("team-daniel-kim");
    await page.getByLabel("Low stock").selectOption("LOW_STOCK");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Barcode scanner pool")).toBeVisible();

    await page.getByRole("link", { name: "New inventory item" }).click();
    await expect(
      page.getByRole("heading", { name: "New inventory item" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create inventory item" }).click();
    await expect(page.getByText("Name is required.")).toBeVisible();

    await page.getByLabel("Name").fill(testInventory.name);
    await page.getByLabel("Status").selectOption("ASSIGNED");
    await page.getByRole("button", { name: "Create inventory item" }).click();
    await expect(
      page
        .getByText("Choose a customer or order for assigned inventory.")
        .first(),
    ).toBeVisible();

    await page.getByLabel("Category").selectOption("DEVICE");
    await page.getByLabel("Status").selectOption("RESERVED");
    await page.getByLabel("Quantity").fill("1");
    await page.getByLabel("Low-stock threshold").fill("2");
    await page.getByLabel("Reference code").fill(testInventory.referenceCode);
    await page.getByLabel("Location").fill(testInventory.location);
    await page.getByLabel("Owner").selectOption("team-marcus-reed");
    await page
      .getByLabel("Related order")
      .selectOption({ label: "POS device rollout - Northstar Outfitters Demo" });
    await page.getByLabel("Notes").fill(testInventory.notes);
    await page.getByRole("button", { name: "Create inventory item" }).click();

    await expect(page).toHaveURL(/\/inventory\/[^/]+\?created=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(
      page.getByText("Inventory item created successfully."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testInventory.name }),
    ).toBeVisible();
    await expect(
      page.getByText(testInventory.referenceCode, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Low stock").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Northstar Outfitters Demo" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "POS device rollout" }))
      .toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Status").selectOption("ASSIGNED");
    await page.getByLabel("Quantity").fill("10");
    await page.getByLabel("Low-stock threshold").fill("2");
    await page.getByLabel("Owner").selectOption("team-sofia-patel");
    await page.getByLabel("Notes").fill(testInventory.updatedNotes);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/inventory\/[^/]+\?saved=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(
      page.getByText("Inventory item updated successfully."),
    ).toBeVisible();
    await expect(page.getByText("Stock ok").first()).toBeVisible();
    await expect(page.getByText("Sofia Patel", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Back to inventory" }).click();
    await expect(page).toHaveURL(/\/inventory$/);
    await page.getByLabel("Search").fill(testInventory.name);
    await page.getByLabel("Low stock").selectOption("OK");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testInventory.name)).toBeVisible();

    await page
      .getByRole("link", { name: `View ${testInventory.name}` })
      .click();
    await expect(page).toHaveURL(/\/inventory\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: testInventory.name }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Archive ${testInventory.name}` })
      .click();
    await expect(
      page.getByRole("dialog", { name: testInventory.name }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Archive inventory item" }).click();

    await expect(page).toHaveURL(/\/inventory\?archived=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(
      page.getByText(
        "Inventory item archived and removed from the default list.",
      ),
    ).toBeVisible({ timeout: workflowNavigationTimeout });

    await page.getByLabel("Search").fill(testInventory.name);
    await page.getByLabel("Archive visibility").selectOption("ONLY");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testInventory.name)).toBeVisible();
    await expect(
      page
        .locator("tr")
        .filter({ hasText: testInventory.name })
        .getByText("Archived", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("tr").filter({ hasText: testInventory.name }).getByText(
        "Read only",
        { exact: true },
      ),
    ).toBeVisible();
  });
});
