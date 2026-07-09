import { InventoryStatus } from "@/generated/prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import { validateInput, type ValidationResult } from "@/lib/validation/request";

import {
  buildInventoryWhereInput,
  filterInventoryByLowStockState,
  inventoryListOrderBy,
  inventorySelect,
  isInventoryLowStock,
  listInventoryCustomerChoices,
  listInventoryOwnerChoices,
  listInventoryWorkItemChoices,
  sortInventoryForList,
  toInventoryApi,
} from "./inventory-data";
import {
  inventoryListQuerySchema,
  type InventoryListQuery,
} from "./inventory-validation";
import type {
  InventoryCustomerChoice,
  InventoryOwnerChoice,
  InventoryWorkItemChoice,
} from "./inventory-ui";

export type InventorySearchParams = Record<
  string,
  string | string[] | undefined
>;

export type InventoryRecordView = ReturnType<typeof toInventoryApi>;

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const readInventorySearchParam = readSearchParam;

export const parseInventoryListFilters = (
  searchParams: InventorySearchParams,
): ValidationResult<InventoryListQuery> =>
  validateInput(inventoryListQuerySchema, {
    archiveState: readSearchParam(searchParams.archiveState),
    category: readSearchParam(searchParams.category),
    customerId: readSearchParam(searchParams.customerId),
    includeArchived: readSearchParam(searchParams.includeArchived),
    lowStockState: readSearchParam(searchParams.lowStockState),
    ownerId: readSearchParam(searchParams.ownerId),
    q: readSearchParam(searchParams.q),
    status: readSearchParam(searchParams.status),
    workItemId: readSearchParam(searchParams.workItemId),
  });

const includeCurrentCustomerChoice = (
  customer: InventoryCustomerChoice | null,
  choices: InventoryCustomerChoice[],
) => {
  if (!customer || choices.some((choice) => choice.id === customer.id)) {
    return choices;
  }

  return [customer, ...choices];
};

const includeCurrentOwnerChoice = (
  owner: InventoryOwnerChoice | null,
  choices: InventoryOwnerChoice[],
) => {
  if (!owner || choices.some((choice) => choice.id === owner.id)) {
    return choices;
  }

  return [owner, ...choices];
};

const includeCurrentWorkItemChoice = (
  workItem: InventoryWorkItemChoice | null,
  choices: InventoryWorkItemChoice[],
) => {
  if (!workItem || choices.some((choice) => choice.id === workItem.id)) {
    return choices;
  }

  return [workItem, ...choices];
};

const hasInventoryListFilters = (filters: InventoryListQuery) =>
  Boolean(
    filters.q ||
      filters.category ||
      filters.status ||
      filters.customerId ||
      filters.workItemId ||
      filters.ownerId ||
      filters.lowStockState ||
      filters.archiveState !== "WITHOUT" ||
      filters.includeArchived,
  );

const assignedOrReservedStatuses: InventoryStatus[] = [
  InventoryStatus.ASSIGNED,
  InventoryStatus.RESERVED,
];

export const getInventoryListPageData = async (
  filters: InventoryListQuery,
) => {
  const prisma = getPrismaClient();

  const [
    inventoryItems,
    metricItems,
    archivedCount,
    customers,
    workItems,
    owners,
  ] = await Promise.all([
    prisma.inventoryItem.findMany({
      orderBy: inventoryListOrderBy,
      select: inventorySelect,
      take: 200,
      where: buildInventoryWhereInput(filters),
    }),
    prisma.inventoryItem.findMany({
      select: {
        archivedAt: true,
        lowStockThreshold: true,
        quantity: true,
        status: true,
      },
      where: {
        archivedAt: null,
      },
    }),
    prisma.inventoryItem.count({
      where: {
        archivedAt: { not: null },
      },
    }),
    listInventoryCustomerChoices(prisma),
    listInventoryWorkItemChoices(prisma),
    listInventoryOwnerChoices(prisma),
  ]);

  const filteredItems = filterInventoryByLowStockState(
    inventoryItems,
    filters.lowStockState,
  );

  return {
    customers,
    hasFilters: hasInventoryListFilters(filters),
    inventoryItems: sortInventoryForList(filteredItems).map(toInventoryApi),
    metrics: {
      archived: archivedCount,
      assignedOrReserved: metricItems.filter((item) =>
        assignedOrReservedStatuses.includes(item.status),
      ).length,
      lowStock: metricItems.filter(isInventoryLowStock).length,
      tracked: metricItems.length,
    },
    owners,
    workItems,
  };
};

export const getInventoryCreatePageData = async () => {
  const prisma = getPrismaClient();
  const [customers, workItems, owners] = await Promise.all([
    listInventoryCustomerChoices(prisma),
    listInventoryWorkItemChoices(prisma),
    listInventoryOwnerChoices(prisma),
  ]);

  return { customers, owners, workItems };
};

export const getInventoryDetail = async (id: string) => {
  const prisma = getPrismaClient();
  const inventoryItem = await prisma.inventoryItem.findUnique({
    select: inventorySelect,
    where: { id },
  });

  return inventoryItem ? toInventoryApi(inventoryItem) : null;
};

export const getInventoryEditPageData = async (id: string) => {
  const prisma = getPrismaClient();
  const [inventoryRecord, customers, workItems, owners] = await Promise.all([
    prisma.inventoryItem.findUnique({
      select: inventorySelect,
      where: { id },
    }),
    listInventoryCustomerChoices(prisma),
    listInventoryWorkItemChoices(prisma),
    listInventoryOwnerChoices(prisma),
  ]);

  if (!inventoryRecord) {
    return null;
  }

  const inventoryItem = toInventoryApi(inventoryRecord);

  return {
    customers: includeCurrentCustomerChoice(inventoryItem.customer, customers),
    inventoryItem,
    owners: includeCurrentOwnerChoice(inventoryItem.owner, owners),
    workItems: includeCurrentWorkItemChoice(inventoryItem.workItem, workItems),
  };
};
