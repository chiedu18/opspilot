import "./helpers/load-env";

import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { signInAsDemoUser } from "./helpers/auth";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for issue browser tests.");
}

const pool = new Pool({ connectionString: databaseUrl });

const testIssue = {
  description: "Demo test issue created by the browser workflow.",
  resolutionNotes: "Demo test issue was reproduced, patched, and retested.",
  title: "Playwright Issue Demo",
  updatedDescription: "Demo test issue reopened for a follow-up browser check.",
};

const workflowNavigationTimeout = 15_000;

const deleteTestIssue = async () => {
  await pool.query("DELETE FROM issues WHERE title = $1", [testIssue.title]);
};

test.describe.serial("issue workflow", () => {
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    await deleteTestIssue();
  });

  test.afterAll(async () => {
    await deleteTestIssue();
    await pool.end();
  });

  test("creates, filters, resolves, reopens, closes, views, and archives an issue", async ({
    page,
  }) => {
    await signInAsDemoUser(page);

    await page.goto("/issues");
    await expect(
      page.getByRole("heading", { exact: true, name: "Issues" }),
    ).toBeVisible();
    await expect(page.getByText("Device shipment delay")).toBeVisible({
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Issue records")).toBeVisible();
    await expect(page.getByRole("link", { name: "New issue" })).toBeVisible();

    await page.getByLabel("Search").fill("Northstar");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Device shipment delay")).toBeVisible({
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Reminder copy approval missing")).toHaveCount(
      0,
    );

    await page.goto("/issues");
    await expect(page).toHaveURL(/\/issues$/);
    await page.getByLabel("Category").selectOption("DATA_QUALITY");
    await page.getByLabel("Priority").selectOption("URGENT");
    await page.getByLabel("Status").selectOption("BLOCKED");
    await page.getByLabel("Customer").selectOption("cust-bluepeak-nonprofit");
    await page
      .getByLabel("Related order")
      .selectOption("work-bluepeak-donor-campaign");
    await page
      .getByLabel("Owner", { exact: true })
      .selectOption("team-olivia-chen");
    await page.getByLabel("Resolution").selectOption("UNRESOLVED");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Donor segment file blocked")).toBeVisible({
      timeout: workflowNavigationTimeout,
    });

    await page.getByRole("link", { name: "New issue" }).click();
    await expect(page.getByRole("heading", { name: "New issue" })).toBeVisible();

    await page.getByRole("button", { name: "Create issue" }).click();
    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.getByText("Description is required.")).toBeVisible();

    await page.getByLabel("Title").fill(testIssue.title);
    await page.getByLabel("Category").selectOption("BUG");
    await page.getByLabel("Priority").selectOption("HIGH");
    await page.getByLabel("Status").selectOption("OPEN");
    await page
      .getByLabel("Owner", { exact: true })
      .selectOption("team-daniel-kim");
    await page
      .getByLabel("Related order")
      .selectOption("work-northstar-pos-device-rollout");
    await expect(page.getByLabel("Related customer")).toHaveValue(
      "cust-northstar-outfitters",
    );
    await page.getByLabel("Description").fill(testIssue.description);
    await page.getByRole("button", { name: "Create issue" }).click();

    await expect(page).toHaveURL(/\/issues\/[^/]+\?created=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Issue created successfully.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: testIssue.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Northstar Outfitters Demo" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "POS device rollout" }))
      .toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Priority").selectOption("URGENT");
    await page.getByLabel("Status").selectOption("RESOLVED");
    await page
      .getByLabel("Owner", { exact: true })
      .selectOption("team-sofia-patel");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.locator("#resolutionNotes-error")).toContainText(
      "Resolution notes are required when resolving or closing an issue.",
      { timeout: workflowNavigationTimeout },
    );

    await page.getByLabel("Resolution notes").fill(testIssue.resolutionNotes);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/issues\/[^/]+\?resolved=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Issue resolved successfully.")).toBeVisible();
    await expect(page.getByText("Resolved").first()).toBeVisible();
    await expect(page.getByText("Sofia Patel", { exact: true })).toBeVisible();
    await expect(page.getByText(testIssue.resolutionNotes)).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Status").selectOption("IN_PROGRESS");
    await page.getByLabel("Description").fill(testIssue.updatedDescription);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/issues\/[^/]+\?saved=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Issue updated successfully.")).toBeVisible();
    await expect(page.getByText("Unresolved").first()).toBeVisible();
    await expect(page.getByText("Not recorded").first()).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Status").selectOption("CLOSED");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/issues\/[^/]+\?closed=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(page.getByText("Issue closed successfully.")).toBeVisible();
    await expect(page.getByText("Closed").first()).toBeVisible();

    await page.getByRole("link", { name: "Back to issues" }).click();
    await expect(page).toHaveURL(/\/issues$/);
    await page.getByLabel("Search").fill(testIssue.title);
    await page.getByLabel("Resolution").selectOption("RESOLVED");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testIssue.title)).toBeVisible();

    await page.getByRole("link", { name: `View ${testIssue.title}` }).click();
    await expect(page).toHaveURL(/\/issues\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: testIssue.title }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Archive ${testIssue.title}` })
      .click();
    await expect(
      page.getByRole("dialog", { name: testIssue.title }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Archive issue" }).click();

    await expect(page).toHaveURL(/\/issues\?archived=1$/, {
      timeout: workflowNavigationTimeout,
    });
    await expect(
      page.getByText("Issue archived and removed from the default list."),
    ).toBeVisible();

    await page.getByLabel("Search").fill(testIssue.title);
    await page.getByLabel("Archive visibility").selectOption("ONLY");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(testIssue.title)).toBeVisible();
    await expect(
      page
        .locator("tr")
        .filter({ hasText: testIssue.title })
        .getByText("Archived", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator("tr")
        .filter({ hasText: testIssue.title })
        .getByText("Read only", { exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: `View ${testIssue.title}` }).click();
    await expect(
      page.getByText("Archived issues are retained as read-only records"),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
  });
});
