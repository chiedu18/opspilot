import "./helpers/load-env";

import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { signInAsDemoUser } from "./helpers/auth";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for customer browser tests.");
}

const pool = new Pool({ connectionString: databaseUrl });

const testCustomer = {
  contactName: "Taylor Morgan",
  email: "playwright.customer@opspilot-demo.test",
  name: "Playwright Customer Demo",
  notes: "Demo test customer created by the browser workflow.",
  phone: "555-0198",
  updatedContactName: "Taylor Morgan Updated",
};

const workflowNavigationTimeout = 15_000;

const deleteTestCustomer = async () => {
  await pool.query("DELETE FROM customers WHERE email = $1", [
    testCustomer.email,
  ]);
};

test.describe.serial("customer workflow", () => {
  test.setTimeout(75_000);

  test.beforeAll(async () => {
    await deleteTestCustomer();
  });

  test.afterAll(async () => {
    await deleteTestCustomer();
    await pool.end();
  });

  test("creates, filters, edits, views, and archives a customer", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    await page.goto("/customers");
    await expect(
      page.getByRole("heading", { exact: true, name: "Customers" }),
    ).toBeVisible();
    await expect(page.getByText("Northstar Outfitters Demo")).toBeVisible();
    await expect(page.getByText("ClearSky Logistics Demo")).toHaveCount(0);

    await page.getByLabel("Status").selectOption("ARCHIVED");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("ClearSky Logistics Demo")).toBeVisible({
      timeout: workflowNavigationTimeout,
    });

    await page.getByRole("link", { name: "Reset" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByText("Northstar Outfitters Demo")).toBeVisible();
    await page.getByLabel("Search").fill("Northstar");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Northstar Outfitters Demo")).toBeVisible();
    await expect(page.getByText("Harborview Dental Demo")).toHaveCount(0);

    await page.getByRole("link", { name: "New customer" }).click();
    await expect(
      page.getByRole("heading", { name: "New customer" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create customer" }).click();
    await expect(page.getByText("Customer name is required.")).toBeVisible();
    await expect(page.getByText("Contact name is required.")).toBeVisible();

    await page.getByLabel("Customer name").fill(testCustomer.name);
    await page.getByLabel("Contact name").fill(testCustomer.contactName);
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Create customer" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();

    await page.getByLabel("Email").fill(testCustomer.email);
    await page.getByLabel("Phone").fill(testCustomer.phone);
    await page.getByLabel("Status").selectOption("ACTIVE");
    await page.getByLabel("Owner").selectOption("team-marcus-reed");
    await page.getByLabel("Notes").fill(testCustomer.notes);
    await page.getByRole("button", { name: "Create customer" }).click();

    await expect(page).toHaveURL(/\/customers\/[^/]+\?created=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Customer created successfully.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testCustomer.name }),
    ).toBeVisible();
    await expect(page.getByText("Marcus Reed")).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Contact name").fill(testCustomer.updatedContactName);
    await page.getByLabel("Status").selectOption("PAUSED");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/customers\/[^/]+\?saved=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Customer updated successfully.")).toBeVisible();
    await expect(
      page.getByText(testCustomer.updatedContactName, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Paused")).toBeVisible();

    await page.getByRole("link", { name: "Back to customers" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await page.getByLabel("Search").fill(testCustomer.name);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testCustomer.name)).toBeVisible();

    await page.getByRole("link", { name: `View ${testCustomer.name}` }).click();
    await expect(page).toHaveURL(/\/customers\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: testCustomer.name }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Archive ${testCustomer.name}` })
      .click();
    await expect(
      page.getByRole("dialog", { name: testCustomer.name }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Archive customer" }).click();

    await expect(page).toHaveURL(/\/customers\?archived=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(
      page.getByText("Customer archived and removed from the default list."),
    ).toBeVisible();

    await page.getByLabel("Search").fill(testCustomer.name);
    await page.getByLabel("Status").selectOption("ARCHIVED");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testCustomer.name)).toBeVisible();
    await expect(
      page
        .locator("tr")
        .filter({ hasText: testCustomer.name })
        .getByText("Archived", { exact: true }),
    ).toBeVisible();
  });
});
