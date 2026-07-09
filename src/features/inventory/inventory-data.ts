import {
  CustomerStatus,
  InventoryStatus,
  TeamMemberStatus,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import type {
  InventoryCreateInput,
  InventoryListQuery,
  InventoryLowStockState,
  InventoryUpdateInput,
} from "./inventory-validation";

export const inventoryCustomerSelect = {
  id: true,
  name: true,
  status: true,
  archivedAt: true,
} satisfies Prisma.CustomerSelect;

export const inventoryWorkItemSelect = {
  id: true,
  title: true,
  status: true,
  customerId: true,
  archivedAt: true,
  customer: {
    select: inventoryCustomerSelect,
  },
} satisfies Prisma.WorkItemSelect;

export const inventoryOwnerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} satisfies Prisma.TeamMemberSelect;

export const inventorySelect = {
  id: true,
  name: true,
  category: true,
  status: true,
  quantity: true,
  lowStockThreshold: true,
  location: true,
  referenceCode: true,
  notes: true,
  ownerId: true,
  owner: {
    select: inventoryOwnerSelect,
  },
  customerId: true,
  customer: {
    select: inventoryCustomerSelect,
  },
  workItemId: true,
  workItem: {
    select: inventoryWorkItemSelect,
  },
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  _count: {
    select: {
      activityEvents: true,
    },
  },
} satisfies Prisma.InventoryItemSelect;

type InventoryRecord = Prisma.InventoryItemGetPayload<{
  select: typeof inventorySelect;
}>;

export type InventoryCustomerOption = Prisma.CustomerGetPayload<{
  select: typeof inventoryCustomerSelect;
}>;

export type InventoryWorkItemOption = Prisma.WorkItemGetPayload<{
  select: typeof inventoryWorkItemSelect;
}>;

export type InventoryOwnerOption = Prisma.TeamMemberGetPayload<{
  select: typeof inventoryOwnerSelect;
}>;

type InventoryLowStockInput = {
  archivedAt?: Date | string | null;
  lowStockThreshold: number;
  quantity: number;
  status: InventoryStatus;
};

type InventoryAssignmentInput = {
  customerId: string | null;
  status: InventoryStatus;
  workItemId: string | null;
};

export type InventoryRelationshipSnapshot = {
  archivedAt: Date | null;
  customerId: string | null;
  id: string;
  ownerId: string | null;
  referenceCode: string | null;
  status: InventoryStatus;
  workItemId: string | null;
};

const archiveStateForFilters = (
  filters: Pick<InventoryListQuery, "archiveState" | "includeArchived">,
) => {
  if (filters.includeArchived && filters.archiveState === "WITHOUT") {
    return "WITH";
  }

  return filters.archiveState;
};

const optionalCreateRelation = (id: string | null | undefined) => {
  if (!id) {
    return {};
  }

  return { connect: { id } };
};

const optionalUpdateRelation = (id: string | null | undefined) => {
  if (id === undefined) {
    return {};
  }

  if (id === null) {
    return { disconnect: true };
  }

  return { connect: { id } };
};

const inventoryStatusRank: Record<InventoryStatus, number> = {
  [InventoryStatus.LOW_STOCK]: 0,
  [InventoryStatus.UNAVAILABLE]: 1,
  [InventoryStatus.RESERVED]: 2,
  [InventoryStatus.ASSIGNED]: 3,
  [InventoryStatus.AVAILABLE]: 4,
  [InventoryStatus.RETIRED]: 5,
};

export const isInventoryLowStock = (item: InventoryLowStockInput) => {
  if (
    item.archivedAt ||
    item.status === InventoryStatus.RETIRED ||
    item.status === InventoryStatus.UNAVAILABLE
  ) {
    return false;
  }

  if (item.status === InventoryStatus.LOW_STOCK) {
    return true;
  }

  return item.lowStockThreshold > 0 && item.quantity <= item.lowStockThreshold;
};

export const requiresInventoryAssignmentContext = (status: InventoryStatus) =>
  status === InventoryStatus.ASSIGNED || status === InventoryStatus.RESERVED;

export const hasInventoryAssignmentContext = ({
  customerId,
  status,
  workItemId,
}: InventoryAssignmentInput) =>
  !requiresInventoryAssignmentContext(status) ||
  Boolean(customerId || workItemId);

export const buildInventoryWhereInput = ({
  archiveState,
  category,
  customerId,
  includeArchived,
  ownerId,
  q,
  status,
  workItemId,
}: InventoryListQuery): Prisma.InventoryItemWhereInput => {
  const where: Prisma.InventoryItemWhereInput = {};
  const effectiveArchiveState = archiveStateForFilters({
    archiveState,
    includeArchived,
  });

  if (effectiveArchiveState === "WITHOUT") {
    where.archivedAt = null;
  }

  if (effectiveArchiveState === "ONLY") {
    where.archivedAt = { not: null };
  }

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (workItemId) {
    where.workItemId = workItemId;
  }

  if (ownerId) {
    where.ownerId = ownerId;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { referenceCode: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { customer: { is: { name: { contains: q, mode: "insensitive" } } } },
      { workItem: { is: { title: { contains: q, mode: "insensitive" } } } },
      { owner: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return where;
};

export const filterInventoryByLowStockState = <TItem extends InventoryLowStockInput>(
  items: TItem[],
  lowStockState?: InventoryLowStockState,
) => {
  if (!lowStockState) {
    return items;
  }

  return items.filter((item) =>
    lowStockState === "LOW_STOCK"
      ? isInventoryLowStock(item)
      : !isInventoryLowStock(item),
  );
};

export const sortInventoryForList = <TItem extends InventoryLowStockInput & {
  name: string;
  updatedAt: Date;
}>(
  items: TItem[],
) =>
  [...items].sort((left, right) => {
    const leftLowStock = isInventoryLowStock(left);
    const rightLowStock = isInventoryLowStock(right);

    if (leftLowStock !== rightLowStock) {
      return leftLowStock ? -1 : 1;
    }

    const statusDifference =
      inventoryStatusRank[left.status] - inventoryStatusRank[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const nameDifference = left.name.localeCompare(right.name);

    if (nameDifference !== 0) {
      return nameDifference;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

export const inventoryListOrderBy = [
  { updatedAt: "desc" },
  { name: "asc" },
] satisfies Prisma.InventoryItemOrderByWithRelationInput[];

export const toInventoryApi = (item: InventoryRecord) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  status: item.status,
  quantity: item.quantity,
  lowStockThreshold: item.lowStockThreshold,
  location: item.location,
  referenceCode: item.referenceCode,
  notes: item.notes,
  ownerId: item.ownerId,
  owner: item.owner,
  customerId: item.customerId,
  customer: item.customer,
  workItemId: item.workItemId,
  workItem: item.workItem,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  archivedAt: item.archivedAt,
  isLowStock: isInventoryLowStock(item),
  counts: {
    activityEvents: item._count.activityEvents,
  },
});

export const createInventoryData = ({
  customerId,
  ownerId,
  workItemId,
  ...input
}: InventoryCreateInput): Prisma.InventoryItemCreateInput => ({
  ...input,
  location: input.location ?? null,
  notes: input.notes ?? null,
  referenceCode: input.referenceCode ?? null,
  ...(customerId ? { customer: optionalCreateRelation(customerId) } : {}),
  ...(ownerId ? { owner: optionalCreateRelation(ownerId) } : {}),
  ...(workItemId ? { workItem: optionalCreateRelation(workItemId) } : {}),
});

export const updateInventoryData = ({
  customerId,
  ownerId,
  workItemId,
  ...input
}: InventoryUpdateInput): Prisma.InventoryItemUpdateInput => ({
  ...input,
  ...(customerId === undefined
    ? {}
    : { customer: optionalUpdateRelation(customerId) }),
  ...(ownerId === undefined ? {} : { owner: optionalUpdateRelation(ownerId) }),
  ...(workItemId === undefined
    ? {}
    : { workItem: optionalUpdateRelation(workItemId) }),
});

export const isActiveInventoryOwner = async (
  prisma: PrismaClient,
  ownerId: string,
) => {
  const owner = await prisma.teamMember.findFirst({
    select: { id: true },
    where: {
      archivedAt: null,
      id: ownerId,
      status: TeamMemberStatus.ACTIVE,
    },
  });

  return Boolean(owner);
};

export const isAvailableInventoryCustomer = async (
  prisma: PrismaClient,
  customerId: string,
) => {
  const customer = await prisma.customer.findFirst({
    select: { id: true },
    where: {
      archivedAt: null,
      id: customerId,
      status: { not: CustomerStatus.ARCHIVED },
    },
  });

  return Boolean(customer);
};

export const findAvailableInventoryWorkItem = (
  prisma: PrismaClient,
  workItemId: string,
) =>
  prisma.workItem.findFirst({
    select: {
      customerId: true,
      id: true,
    },
    where: {
      archivedAt: null,
      id: workItemId,
    },
  });

export const findInventoryByReferenceCode = (
  prisma: PrismaClient,
  referenceCode: string,
  excludeId?: string,
) =>
  prisma.inventoryItem.findFirst({
    select: { id: true },
    where: {
      referenceCode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

export const listInventoryCustomerChoices = (prisma: PrismaClient) =>
  prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: inventoryCustomerSelect,
    where: {
      archivedAt: null,
      status: { not: CustomerStatus.ARCHIVED },
    },
  });

export const listInventoryWorkItemChoices = (prisma: PrismaClient) =>
  prisma.workItem.findMany({
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
    select: inventoryWorkItemSelect,
    where: {
      archivedAt: null,
    },
  });

export const listInventoryOwnerChoices = (prisma: PrismaClient) =>
  prisma.teamMember.findMany({
    orderBy: { name: "asc" },
    select: inventoryOwnerSelect,
    where: {
      archivedAt: null,
      status: TeamMemberStatus.ACTIVE,
    },
  });
