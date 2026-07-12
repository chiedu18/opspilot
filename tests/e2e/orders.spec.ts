import "./helpers/load-env";

import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { signInAsDemoUser } from "./helpers/auth";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for order browser tests.");
}

const pool = new Pool({ connectionString: databaseUrl });

const testOrder = {
  dueDate: "2026-07-12",
  estimatedValue: "1234.56",
  notes: "Demo test order created by the browser workflow.",
  title: "Playwright Order Demo",
  updatedDueDate: "2026-07-01",
  updatedNotes: "Demo test order updated by the browser workflow.",
};

const workflowNavigationTimeout = 15_000;

const deleteTestOrder = async () => {
  await pool.query("DELETE FROM work_items WHERE title = $1", [
    testOrder.title,
  ]);
};

test.describe.serial("order workflow", () => {
  test.setTimeout(75_000);

  test.beforeAll(async () => {
    await deleteTestOrder();
  });

  test.afterAll(async () => {
    await deleteTestOrder();
    await pool.end();
  });

  test("creates, filters, edits, views, and archives an order", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    await page.goto("/orders");
    await expect(
      page.getByRole("heading", { exact: true, name: "Orders" }),
    ).toBeVisible();
    await expect(page.getByText("POS device rollout")).toBeVisible();
    await expect(page.getByText("Order and campaign records")).toBeVisible();

    await page.getByLabel("Search").fill("Northstar");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("POS device rollout")).toBeVisible();
    await expect(page.getByText("Patient reminder workflow")).toHaveCount(0);

    await page.goto("/orders");
    await expect(page).toHaveURL(/\/orders$/);
    await page.getByLabel("Status").selectOption("BLOCKED");
    await page.getByLabel("Priority").selectOption("HIGH");
    await page.getByLabel("Kind").selectOption("SERVICE_REQUEST");
    await page.getByLabel("Owner").selectOption("team-sofia-patel");
    await page.getByLabel("Due date").selectOption("OVERDUE");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Patient reminder workflow")).toBeVisible();

    await page.getByRole("link", { name: "New order" }).click();
    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    await page.getByRole("button", { name: "Create order" }).click();
    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.getByText("Due date is required.")).toBeVisible();

    await page.getByLabel("Title").fill(testOrder.title);
    await page.getByLabel("Kind").selectOption("CAMPAIGN");
    await page.getByLabel("Status").selectOption("ACTIVE");
    await page.getByLabel("Priority").selectOption("HIGH");
    await page.getByLabel("Due date").fill(testOrder.dueDate);
    await page.getByLabel("Estimated value").fill(testOrder.estimatedValue);
    await page
      .getByLabel("Customer")
      .selectOption({ label: "Northstar Outfitters Demo" });
    await page.getByLabel("Owner").selectOption("team-marcus-reed");
    await page.getByLabel("Notes").fill(testOrder.notes);
    await page.getByRole("button", { name: "Create order" }).click();

    await expect(page).toHaveURL(/\/orders\/[^/]+\?created=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Order created successfully.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testOrder.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Northstar Outfitters Demo" }),
    ).toBeVisible();
    await expect(page.getByText("$1,234.56")).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Status").selectOption("BLOCKED");
    await page.getByLabel("Priority").selectOption("URGENT");
    await page.getByLabel("Due date").fill(testOrder.updatedDueDate);
    await page.getByLabel("Owner").selectOption("team-sofia-patel");
    await page.getByLabel("Notes").fill(testOrder.updatedNotes);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/orders\/[^/]+\?saved=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Order updated successfully.")).toBeVisible();
    await expect(page.getByText("Urgent")).toBeVisible();
    await expect(page.getByText("Overdue").first()).toBeVisible();
    await expect(page.getByText("Sofia Patel", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Back to orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await page.getByLabel("Search").fill(testOrder.title);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testOrder.title)).toBeVisible();

    await page.getByRole("link", { name: `View ${testOrder.title}` }).click();
    await expect(page).toHaveURL(/\/orders\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: testOrder.title }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Archive ${testOrder.title}` })
      .click();
    await expect(
      page.getByRole("dialog", { name: testOrder.title }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Archive order" }).click();

    await expect(page).toHaveURL(/\/orders\?archived=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(
      page.getByText("Order archived and removed from the default list."),
    ).toBeVisible();

    await page.getByLabel("Search").fill(testOrder.title);
    await page.getByLabel("Archive visibility").selectOption("ONLY");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testOrder.title)).toBeVisible();
    await expect(
      page
        .locator("tr")
        .filter({ hasText: testOrder.title })
        .getByText("Archived", { exact: true }),
    ).toBeVisible();
  });
});
