import { describe, expect, it } from "vitest";

import {
  CustomerStatus,
  InventoryCategory,
  InventoryStatus,
  TeamMemberStatus,
  TeamRole,
  WorkItemStatus,
} from "../../src/generated/prisma/client";
import {
  buildInventoryWhereInput,
  filterInventoryByLowStockState,
  hasInventoryAssignmentContext,
  isInventoryLowStock,
  sortInventoryForList,
  toInventoryApi,
} from "../../src/features/inventory/inventory-data";

const updatedAt = new Date("2026-07-07T12:00:00.000Z");

describe("inventory data helpers", () => {
  it("hides archived inventory by default", () => {
    const where = buildInventoryWhereInput({
      archiveState: "WITHOUT",
      includeArchived: false,
    });

    expect(where).toEqual({
      archivedAt: null,
    });
  });

  it("supports explicit archived visibility", () => {
    expect(
      buildInventoryWhereInput({
        archiveState: "ONLY",
        includeArchived: false,
      }),
    ).toEqual({
      archivedAt: { not: null },
    });

    expect(
      buildInventoryWhereInput({
        archiveState: "WITHOUT",
        includeArchived: true,
      }),
    ).toEqual({});
  });

  it("builds search, relation, category, status, and owner filters", () => {
    const where = buildInventoryWhereInput({
      archiveState: "WITHOUT",
      category: InventoryCategory.DEVICE,
      customerId: "cust-northstar-outfitters",
      includeArchived: false,
      ownerId: "team-ava-morgan",
      q: "router",
      status: InventoryStatus.ASSIGNED,
      workItemId: "work-northstar-pos-device-rollout",
    });

    expect(where).toEqual({
      archivedAt: null,
      category: InventoryCategory.DEVICE,
      customerId: "cust-northstar-outfitters",
      ownerId: "team-ava-morgan",
      status: InventoryStatus.ASSIGNED,
      workItemId: "work-northstar-pos-device-rollout",
      OR: [
        { name: { contains: "router", mode: "insensitive" } },
        { referenceCode: { contains: "router", mode: "insensitive" } },
        { location: { contains: "router", mode: "insensitive" } },
        { notes: { contains: "router", mode: "insensitive" } },
        {
          customer: {
            is: { name: { contains: "router", mode: "insensitive" } },
          },
        },
        {
          workItem: {
            is: { title: { contains: "router", mode: "insensitive" } },
          },
        },
        {
          owner: {
            is: { name: { contains: "router", mode: "insensitive" } },
          },
        },
      ],
    });
  });

  it("derives low-stock state from status and quantity threshold", () => {
    expect(
      isInventoryLowStock({
        archivedAt: null,
        lowStockThreshold: 4,
        quantity: 1,
        status: InventoryStatus.AVAILABLE,
      }),
    ).toBe(true);

    expect(
      isInventoryLowStock({
        archivedAt: null,
        lowStockThreshold: 0,
        quantity: 20,
        status: InventoryStatus.LOW_STOCK,
      }),
    ).toBe(true);

    expect(
      isInventoryLowStock({
        archivedAt: null,
        lowStockThreshold: 4,
        quantity: 1,
        status: InventoryStatus.RETIRED,
      }),
    ).toBe(false);

    expect(
      isInventoryLowStock({
        archivedAt: new Date("2026-07-07T12:00:00.000Z"),
        lowStockThreshold: 4,
        quantity: 1,
        status: InventoryStatus.AVAILABLE,
      }),
    ).toBe(false);
  });

  it("filters inventory by derived low-stock state", () => {
    const items = [
      {
        id: "low",
        archivedAt: null,
        lowStockThreshold: 4,
        quantity: 1,
        status: InventoryStatus.AVAILABLE,
      },
      {
        id: "ok",
        archivedAt: null,
        lowStockThreshold: 4,
        quantity: 10,
        status: InventoryStatus.AVAILABLE,
      },
    ];

    expect(
      filterInventoryByLowStockState(items, "LOW_STOCK").map((item) => item.id),
    ).toEqual(["low"]);

    expect(filterInventoryByLowStockState(items, "OK").map((item) => item.id))
      .toEqual(["ok"]);
  });

  it("requires related context for assigned or reserved inventory", () => {
    expect(
      hasInventoryAssignmentContext({
        customerId: null,
        status: InventoryStatus.ASSIGNED,
        workItemId: null,
      }),
    ).toBe(false);

    expect(
      hasInventoryAssignmentContext({
        customerId: "cust-demo",
        status: InventoryStatus.RESERVED,
        workItemId: null,
      }),
    ).toBe(true);

    expect(
      hasInventoryAssignmentContext({
        customerId: null,
        status: InventoryStatus.AVAILABLE,
        workItemId: null,
      }),
    ).toBe(true);
  });

  it("sorts low-stock inventory before other statuses, then by status and name", () => {
    const items = [
      {
        id: "available",
        archivedAt: null,
        lowStockThreshold: 1,
        name: "Available item",
        quantity: 10,
        status: InventoryStatus.AVAILABLE,
        updatedAt,
      },
      {
        id: "low-derived",
        archivedAt: null,
        lowStockThreshold: 4,
        name: "Low derived item",
        quantity: 1,
        status: InventoryStatus.AVAILABLE,
        updatedAt,
      },
      {
        id: "low-status",
        archivedAt: null,
        lowStockThreshold: 0,
        name: "Low status item",
        quantity: 20,
        status: InventoryStatus.LOW_STOCK,
        updatedAt,
      },
    ];

    expect(sortInventoryForList(items).map((item) => item.id)).toEqual([
      "low-status",
      "low-derived",
      "available",
    ]);
  });

  it("maps inventory records to API payloads with related summaries", () => {
    const payload = toInventoryApi({
      id: "inv-demo",
      name: "Demo router kit",
      category: InventoryCategory.DEVICE,
      status: InventoryStatus.ASSIGNED,
      quantity: 1,
      lowStockThreshold: 4,
      location: "Shelf A",
      referenceCode: "DEMO-ROUTER",
      notes: "Demo note.",
      ownerId: "team-ava-morgan",
      owner: {
        id: "team-ava-morgan",
        name: "Ava Morgan",
        email: "ava.morgan@opspilot-demo.test",
        role: TeamRole.DEVELOPER,
        status: TeamMemberStatus.ACTIVE,
      },
      customerId: "cust-demo",
      customer: {
        id: "cust-demo",
        name: "Demo Customer",
        status: CustomerStatus.ACTIVE,
        archivedAt: null,
      },
      workItemId: "work-demo",
      workItem: {
        id: "work-demo",
        title: "Demo work item",
        status: WorkItemStatus.ACTIVE,
        customerId: "cust-demo",
        archivedAt: null,
        customer: {
          id: "cust-demo",
          name: "Demo Customer",
          status: CustomerStatus.ACTIVE,
          archivedAt: null,
        },
      },
      createdAt: new Date("2026-07-01T12:00:00.000Z"),
      updatedAt,
      archivedAt: null,
      _count: {
        activityEvents: 2,
      },
    });

    expect(payload.customer?.name).toBe("Demo Customer");
    expect(payload.workItem?.title).toBe("Demo work item");
    expect(payload.owner?.name).toBe("Ava Morgan");
    expect(payload.counts).toEqual({ activityEvents: 2 });
    expect(payload.isLowStock).toBe(true);
  });
});
