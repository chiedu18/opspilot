import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

class DatabaseConfigurationError extends Error {
  constructor() {
    super("DATABASE_URL is required for server-side database access.");
    this.name = "DatabaseConfigurationError";
  }
}

const globalForPrisma = globalThis as unknown as {
  opsPilotPrisma?: PrismaClient;
};

let prismaClient = globalForPrisma.opsPilotPrisma;

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new DatabaseConfigurationError();
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
};

export const getPrismaClient = () => {
  if (!prismaClient) {
    prismaClient = createPrismaClient();

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.opsPilotPrisma = prismaClient;
    }
  }

  return prismaClient;
};

export const isDatabaseConfigurationError = (error: unknown) =>
  error instanceof DatabaseConfigurationError;
