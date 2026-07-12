import { describe, expect, it } from "vitest";

import {
  CustomerStatus,
  TeamMemberStatus,
  TeamRole,
} from "../../src/generated/prisma/client";
import {
  buildCustomerWhereInput,
  createCustomerData,
  toCustomerApi,
} from "../../src/features/customers/customer-data";

describe("customer data helpers", () => {
  it("hides archived customers by default", () => {
    const where = buildCustomerWhereInput({
      includeArchived: false,
    });

    expect(where).toEqual({
      archivedAt: null,
    });
  });

  it("allows archived customers when explicitly filtering archived status", () => {
    const where = buildCustomerWhereInput({
      includeArchived: false,
      status: CustomerStatus.ARCHIVED,
    });

    expect(where).toEqual({
      status: CustomerStatus.ARCHIVED,
    });
  });

  it("creates an unassigned customer without an invalid disconnect relation", () => {
    const data = createCustomerData({
      contactName: "Sandbox QA",
      name: "Isolation check",
      ownerId: null,
      status: CustomerStatus.PROSPECT,
    });

    expect(data).not.toHaveProperty("owner");
  });

  it("builds search and owner filters", () => {
    const where = buildCustomerWhereInput({
      includeArchived: false,
      ownerId: "team-olivia-chen",
      q: "Northstar",
      status: CustomerStatus.ACTIVE,
    });

    expect(where).toEqual({
      archivedAt: null,
      ownerId: "team-olivia-chen",
      status: CustomerStatus.ACTIVE,
      OR: [
        { name: { contains: "Northstar", mode: "insensitive" } },
        { contactName: { contains: "Northstar", mode: "insensitive" } },
        { email: { contains: "Northstar", mode: "insensitive" } },
        { phone: { contains: "Northstar", mode: "insensitive" } },
      ],
    });
  });

  it("maps customer records to API payloads with related counts", () => {
    const createdAt = new Date("2026-07-01T12:00:00.000Z");
    const updatedAt = new Date("2026-07-07T12:00:00.000Z");

    const payload = toCustomerApi({
      id: "cust-demo",
      name: "Demo Customer",
      contactName: "Jordan Lee",
      email: "jordan@example.test",
      phone: "555-0199",
      status: CustomerStatus.ACTIVE,
      ownerId: "team-olivia-chen",
      owner: {
        id: "team-olivia-chen",
        name: "Olivia Chen",
        email: "olivia.chen@opspilot-demo.test",
        role: TeamRole.OPERATIONS_MANAGER,
        status: TeamMemberStatus.ACTIVE,
      },
      notes: "Demo note.",
      createdAt,
      updatedAt,
      archivedAt: null,
      _count: {
        inventoryItems: 1,
        issues: 2,
        workItems: 3,
      },
    });

    expect(payload.counts).toEqual({
      inventoryItems: 1,
      issues: 2,
      workItems: 3,
    });
    expect(payload.owner?.name).toBe("Olivia Chen");
    expect(payload.updatedAt).toBe(updatedAt);
  });
});
