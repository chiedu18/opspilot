import { describe, expect, it } from "vitest";

import {
  customers,
  demoSeedCounts,
  DEMO_REFERENCE_DATE,
  inventoryItems,
  issues,
  teamMembers,
  workItems,
} from "../../prisma/seed-data";
import {
  InventoryStatus,
  IssueStatus,
  Priority,
  WorkItemStatus,
} from "../../src/generated/prisma/client";

describe("demo seed data", () => {
  it("matches the Phase 3.3 record-count targets", () => {
    expect(demoSeedCounts).toEqual({
      teamMembers: 6,
      customers: 10,
      workItems: 20,
      inventoryItems: 24,
      issues: 24,
      activityEvents: 12,
    });
  });

  it("uses clearly fictional contact data", () => {
    expect(teamMembers.every(({ email }) => email.endsWith("@opspilot-demo.test"))).toBe(
      true,
    );
    expect(customers.every(({ name }) => name.includes("Demo"))).toBe(true);
    expect(
      customers.every(({ email }) => !email || email.endsWith("-demo.test")),
    ).toBe(true);
    expect(customers.every(({ phone }) => !phone || phone.startsWith("555-"))).toBe(
      true,
    );
    expect(customers.every(({ notes }) => notes?.includes("Demo seed data"))).toBe(
      true,
    );
  });

  it("includes dashboard and reporting edge cases", () => {
    const hasOverdueOpenWork = workItems.some(
      ({ dueDate, status }) =>
        dueDate &&
        dueDate < DEMO_REFERENCE_DATE &&
        (status === WorkItemStatus.ACTIVE || status === WorkItemStatus.BLOCKED),
    );
    const hasCompletedWorkThisWeek = workItems.some(
      ({ completedAt, status }) =>
        status === WorkItemStatus.COMPLETED &&
        completedAt &&
        completedAt >= new Date("2026-07-05T00:00:00.000Z") &&
        completedAt <= DEMO_REFERENCE_DATE,
    );
    const hasLowStockInventory = inventoryItems.some(
      ({ lowStockThreshold, quantity, status }) =>
        status === InventoryStatus.LOW_STOCK &&
        quantity !== undefined &&
        lowStockThreshold !== undefined &&
        quantity <= lowStockThreshold,
    );
    const hasUrgentOpenIssue = issues.some(
      ({ priority, status }) =>
        priority === Priority.URGENT &&
        (status === IssueStatus.OPEN || status === IssueStatus.BLOCKED),
    );

    expect(hasOverdueOpenWork).toBe(true);
    expect(hasCompletedWorkThisWeek).toBe(true);
    expect(hasLowStockInventory).toBe(true);
    expect(hasUrgentOpenIssue).toBe(true);
  });
});
