import { describe, expect, it } from "vitest";

import {
  InventoryCategory,
  InventoryStatus,
} from "../../src/generated/prisma/client";
import {
  inventoryCreateSchema,
  inventoryListQuerySchema,
  inventoryUpdateSchema,
} from "../../src/features/inventory/inventory-validation";

describe("inventory validation", () => {
  it("trims inventory input and normalizes optional blanks", () => {
    const result = inventoryCreateSchema.parse({
      name: "  Router kit  ",
      category: InventoryCategory.DEVICE,
      status: InventoryStatus.AVAILABLE,
      quantity: 4,
      lowStockThreshold: 1,
      location: "  Shelf A  ",
      referenceCode: "  DEMO-ROUTER  ",
      ownerId: "",
      customerId: "  cust-northstar-outfitters  ",
      workItemId: "",
      notes: "",
    });

    expect(result).toEqual({
      name: "Router kit",
      category: InventoryCategory.DEVICE,
      status: InventoryStatus.AVAILABLE,
      quantity: 4,
      lowStockThreshold: 1,
      location: "Shelf A",
      referenceCode: "DEMO-ROUTER",
      ownerId: null,
      customerId: "cust-northstar-outfitters",
      workItemId: null,
      notes: null,
    });
  });

  it("rejects missing required inventory fields", () => {
    const result = inventoryCreateSchema.safeParse({
      name: "",
      quantity: 0,
      lowStockThreshold: 0,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.name).toContain("Name is required.");
      expect(errors.category).toBeDefined();
      expect(errors.status).toBeDefined();
    }
  });

  it("rejects negative quantities and thresholds", () => {
    const result = inventoryCreateSchema.safeParse({
      name: "Router kit",
      category: InventoryCategory.DEVICE,
      status: InventoryStatus.AVAILABLE,
      quantity: -1,
      lowStockThreshold: -1,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.quantity).toContain("Quantity cannot be negative.");
      expect(errors.lowStockThreshold).toContain(
        "Low-stock threshold cannot be negative.",
      );
    }
  });

  it("allows partial updates without requiring every create field", () => {
    const result = inventoryUpdateSchema.parse({
      quantity: 2,
      notes: "  Count adjusted after shelf check.  ",
    });

    expect(result).toEqual({
      quantity: 2,
      notes: "Count adjusted after shelf check.",
    });
  });

  it("rejects empty inventory updates", () => {
    const result = inventoryUpdateSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().formErrors).toContain(
        "At least one inventory field must be provided.",
      );
    }
  });

  it("parses inventory list filters", () => {
    const result = inventoryListQuerySchema.parse({
      archiveState: "ONLY",
      category: InventoryCategory.DEVICE,
      customerId: " cust-northstar-outfitters ",
      includeArchived: "false",
      lowStockState: "LOW_STOCK",
      ownerId: " team-ava-morgan ",
      q: " router ",
      status: InventoryStatus.LOW_STOCK,
      workItemId: " work-northstar-pos-device-rollout ",
    });

    expect(result).toEqual({
      archiveState: "ONLY",
      category: InventoryCategory.DEVICE,
      customerId: "cust-northstar-outfitters",
      includeArchived: false,
      lowStockState: "LOW_STOCK",
      ownerId: "team-ava-morgan",
      q: "router",
      status: InventoryStatus.LOW_STOCK,
      workItemId: "work-northstar-pos-device-rollout",
    });
  });
});
