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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the OpsPilot seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const resetDemoSeedData = async () => {
  await prisma.$transaction(async (tx) => {
    await tx.activityEvent.deleteMany({
      where: { id: { in: demoSeedIds.activityEvents } },
    });
    await tx.issue.deleteMany({
      where: { id: { in: demoSeedIds.issues } },
    });
    await tx.inventoryItem.deleteMany({
      where: { id: { in: demoSeedIds.inventoryItems } },
    });
    await tx.workItem.deleteMany({
      where: { id: { in: demoSeedIds.workItems } },
    });
    await tx.customer.deleteMany({
      where: { id: { in: demoSeedIds.customers } },
    });
    await tx.teamMember.deleteMany({
      where: { id: { in: demoSeedIds.teamMembers } },
    });

    await tx.teamMember.createMany({ data: teamMembers });
    await tx.customer.createMany({ data: customers });
    await tx.workItem.createMany({ data: workItems });
    await tx.inventoryItem.createMany({ data: inventoryItems });
    await tx.issue.createMany({ data: issues });
    await tx.activityEvent.createMany({ data: activityEvents });
  });
};

const readSeededCounts = async () => ({
  teamMembers: await prisma.teamMember.count({
    where: { id: { in: demoSeedIds.teamMembers } },
  }),
  customers: await prisma.customer.count({
    where: { id: { in: demoSeedIds.customers } },
  }),
  workItems: await prisma.workItem.count({
    where: { id: { in: demoSeedIds.workItems } },
  }),
  inventoryItems: await prisma.inventoryItem.count({
    where: { id: { in: demoSeedIds.inventoryItems } },
  }),
  issues: await prisma.issue.count({
    where: { id: { in: demoSeedIds.issues } },
  }),
  activityEvents: await prisma.activityEvent.count({
    where: { id: { in: demoSeedIds.activityEvents } },
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
