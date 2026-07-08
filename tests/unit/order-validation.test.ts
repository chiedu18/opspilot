import { describe, expect, it } from "vitest";

import {
  Priority,
  WorkItemKind,
  WorkItemStatus,
} from "../../src/generated/prisma/client";
import {
  orderCreateSchema,
  orderListQuerySchema,
  orderUpdateSchema,
} from "../../src/features/orders/order-validation";

describe("order validation", () => {
  it("trims order input and parses due dates at noon UTC", () => {
    const result = orderCreateSchema.parse({
      title: "  Demo rollout  ",
      kind: WorkItemKind.ORDER,
      status: WorkItemStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: "2026-07-12",
      estimatedValueCents: 125000,
      customerId: "  cust-northstar-outfitters  ",
      ownerId: "  team-marcus-reed  ",
      notes: "",
    });

    expect(result).toEqual({
      title: "Demo rollout",
      kind: WorkItemKind.ORDER,
      status: WorkItemStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: new Date("2026-07-12T12:00:00.000Z"),
      estimatedValueCents: 125000,
      customerId: "cust-northstar-outfitters",
      ownerId: "team-marcus-reed",
      notes: null,
    });
  });

  it("rejects missing required order fields", () => {
    const result = orderCreateSchema.safeParse({
      title: "",
      dueDate: "",
      customerId: "",
      ownerId: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.title).toContain("Title is required.");
      expect(errors.dueDate).toContain("Due date is required.");
      expect(errors.customerId).toContain("Customer is required.");
      expect(errors.ownerId).toContain("Owner is required.");
      expect(errors.kind).toBeDefined();
      expect(errors.status).toBeDefined();
      expect(errors.priority).toBeDefined();
    }
  });

  it("rejects invalid due dates and negative estimated value", () => {
    const result = orderCreateSchema.safeParse({
      title: "Demo rollout",
      kind: WorkItemKind.ORDER,
      status: WorkItemStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: "not-a-date",
      estimatedValueCents: -1,
      customerId: "cust-northstar-outfitters",
      ownerId: "team-marcus-reed",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.dueDate).toContain("Enter a valid due date.");
      expect(errors.estimatedValueCents).toContain(
        "Estimated value cannot be negative.",
      );
    }
  });

  it("allows partial updates without requiring every create field", () => {
    const result = orderUpdateSchema.parse({
      status: WorkItemStatus.COMPLETED,
      notes: "  Completed after QA review.  ",
    });

    expect(result).toEqual({
      status: WorkItemStatus.COMPLETED,
      notes: "Completed after QA review.",
    });
  });

  it("rejects empty order updates", () => {
    const result = orderUpdateSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().formErrors).toContain(
        "At least one order field must be provided.",
      );
    }
  });

  it("parses order list filters", () => {
    const result = orderListQuerySchema.parse({
      archiveState: "ONLY",
      customerId: " cust-northstar-outfitters ",
      dueDateBucket: "OVERDUE",
      includeArchived: "false",
      kind: WorkItemKind.CAMPAIGN,
      ownerId: " team-olivia-chen ",
      priority: Priority.URGENT,
      q: " donor ",
      status: WorkItemStatus.BLOCKED,
    });

    expect(result).toEqual({
      archiveState: "ONLY",
      customerId: "cust-northstar-outfitters",
      dueDateBucket: "OVERDUE",
      includeArchived: false,
      kind: WorkItemKind.CAMPAIGN,
      ownerId: "team-olivia-chen",
      priority: Priority.URGENT,
      q: "donor",
      status: WorkItemStatus.BLOCKED,
    });
  });
});
