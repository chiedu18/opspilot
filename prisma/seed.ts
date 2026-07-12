import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  activityEvents,
  customers,
  demoSeedCounts,
  demoSeedIds,
  DEMO_REFERENCE_DATE,
  DEMO_SEED_LABEL,
  inventoryItems,
  issues,
  teamMembers,
  workItems,
} from "./seed-data";

const CANONICAL_WORKSPACE_ID = "workspace-canonical-demo";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the OpsPilot seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const resetDemoSeedData = async () => {
  await prisma.$transaction(async (tx) => {
    await tx.sandboxWorkspace.upsert({
      where: { id: CANONICAL_WORKSPACE_ID },
      create: { id: CANONICAL_WORKSPACE_ID, kind: "CANONICAL" },
      update: { kind: "CANONICAL", expiresAt: null },
    });

    await tx.activityEvent.deleteMany({
      where: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    await tx.issue.deleteMany({
      where: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    await tx.inventoryItem.deleteMany({
      where: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    await tx.workItem.deleteMany({
      where: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    await tx.customer.deleteMany({
      where: { workspaceId: CANONICAL_WORKSPACE_ID },
    });

    for (const teamMember of teamMembers) {
      await tx.teamMember.upsert({
        where: { id: teamMember.id },
        create: teamMember,
        update: teamMember,
      });
    }

    await tx.customer.createMany({
      data: customers.map((customer) => ({
        ...customer,
        workspaceId: CANONICAL_WORKSPACE_ID,
      })),
    });
    await tx.workItem.createMany({
      data: workItems.map((workItem) => ({
        ...workItem,
        workspaceId: CANONICAL_WORKSPACE_ID,
      })),
    });
    await tx.inventoryItem.createMany({
      data: inventoryItems.map((inventoryItem) => ({
        ...inventoryItem,
        workspaceId: CANONICAL_WORKSPACE_ID,
      })),
    });
    await tx.issue.createMany({
      data: issues.map((issue) => ({
        ...issue,
        workspaceId: CANONICAL_WORKSPACE_ID,
      })),
    });
    await tx.activityEvent.createMany({
      data: activityEvents.map((activityEvent) => ({
        ...activityEvent,
        workspaceId: CANONICAL_WORKSPACE_ID,
      })),
    });
  });
};

const readSeededCounts = async () => ({
  teamMembers: await prisma.teamMember.count({
    where: { id: { in: demoSeedIds.teamMembers } },
  }),
  customers: await prisma.customer.count({
    where: { workspaceId: CANONICAL_WORKSPACE_ID },
  }),
  workItems: await prisma.workItem.count({
    where: { workspaceId: CANONICAL_WORKSPACE_ID },
  }),
  inventoryItems: await prisma.inventoryItem.count({
    where: { workspaceId: CANONICAL_WORKSPACE_ID },
  }),
  issues: await prisma.issue.count({
    where: { workspaceId: CANONICAL_WORKSPACE_ID },
  }),
  activityEvents: await prisma.activityEvent.count({
    where: { workspaceId: CANONICAL_WORKSPACE_ID },
  }),
});

const main = async () => {
  await resetDemoSeedData();
  const seededCounts = await readSeededCounts();

  console.log(`Seeded ${DEMO_SEED_LABEL}.`);
  console.log(`Reference date: ${DEMO_REFERENCE_DATE.toISOString().slice(0, 10)}`);
  console.log("Expected counts:", demoSeedCounts);
  console.log("Seeded counts:", seededCounts);
};

main()
  .catch((error: unknown) => {
    console.error("Failed to seed OpsPilot demo data.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
