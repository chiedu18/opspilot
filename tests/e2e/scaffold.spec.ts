import { expect, test } from "@playwright/test";

import { signInAsDemoUser } from "./helpers/auth";

const moduleRoutes = [
  { path: "/orders", heading: "Orders" },
  { path: "/inventory", heading: "Inventory" },
  { path: "/issues", heading: "Issues" },
  { path: "/reports", heading: "Reports" },
];

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
      page.getByRole("heading", { exact: true, name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("No chart data loaded")).toBeVisible();
    await expect(page.getByText("Scaffolded")).toHaveCount(5);
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

  for (const route of moduleRoutes) {
    test(`renders ${route.path} as an empty scaffold`, async ({ page }) => {
      await signInAsDemoUser(page);

      await page.goto(route.path);

      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      await expect(page.getByText("No records loaded")).toBeVisible();
    });
  }

  test("renders customers as the first connected workflow", async ({ page }) => {
    await signInAsDemoUser(page);

    await page.goto("/customers");

    await expect(
      page.getByRole("heading", { exact: true, name: "Customers" }),
    ).toBeVisible();
    await expect(page.getByText("Northstar Outfitters Demo")).toBeVisible();
    await expect(page.getByRole("link", { name: "New customer" })).toBeVisible();
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
  });
});
