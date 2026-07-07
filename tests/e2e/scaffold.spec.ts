import { expect, test } from "@playwright/test";

import { signInAsDemoUser } from "./helpers/auth";

const moduleRoutes = [
  { path: "/customers", heading: "Customers" },
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
