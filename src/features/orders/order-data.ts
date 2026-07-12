import {
  CustomerStatus,
  Priority,
  TeamMemberStatus,
  WorkItemStatus,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import type {
  OrderCreateInput,
  OrderListQuery,
  OrderUpdateInput,
} from "./order-validation";

export const orderCustomerSelect = {
  id: true,
  name: true,
  status: true,
  archivedAt: true,
} satisfies Prisma.CustomerSelect;

export const orderOwnerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} satisfies Prisma.TeamMemberSelect;

export const orderSelect = {
  id: true,
  title: true,
  kind: true,
  status: true,
  priority: true,
  dueDate: true,
  completedAt: true,
  estimatedValueCents: true,
  notes: true,
  customerId: true,
  customer: {
    select: orderCustomerSelect,
  },
  ownerId: true,
  owner: {
    select: orderOwnerSelect,
  },
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  _count: {
    select: {
      inventoryItems: true,
      issues: true,
    },
  },
} satisfies Prisma.WorkItemSelect;

type OrderRecord = Prisma.WorkItemGetPayload<{
  select: typeof orderSelect;
}>;

export type OrderCustomerOption = Prisma.CustomerGetPayload<{
  select: typeof orderCustomerSelect;
}>;

export type OrderOwnerOption = Prisma.TeamMemberGetPayload<{
  select: typeof orderOwnerSelect;
}>;

type WorkItemStatusSnapshot = {
  completedAt: Date | null;
  status: WorkItemStatus;
};

const openDueStatuses: WorkItemStatus[] = [
  WorkItemStatus.DRAFT,
  WorkItemStatus.ACTIVE,
  WorkItemStatus.BLOCKED,
];

const overdueStatuses: WorkItemStatus[] = [
  WorkItemStatus.ACTIVE,
  WorkItemStatus.BLOCKED,
];

const priorityRank: Record<Priority, number> = {
  [Priority.URGENT]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

const archiveStateForFilters = (filters: OrderListQuery) => {
  if (filters.includeArchived && filters.archiveState === "WITHOUT") {
    return "WITH";
  }

  return filters.archiveState;
};

const customerRelation = (customerId: string | undefined) => {
  if (customerId === undefined) {
    return {};
  }

  return { customer: { connect: { id: customerId } } };
};

const ownerRelation = (ownerId: string | undefined) => {
  if (ownerId === undefined) {
    return {};
  }

  return { owner: { connect: { id: ownerId } } };
};

export const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const addUtcDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const readDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const isOrderOverdue = (
  order: {
    archivedAt?: Date | string | null;
    dueDate: Date | string | null;
    status: WorkItemStatus;
  },
  referenceDate = new Date(),
) => {
  if (order.archivedAt || !overdueStatuses.includes(order.status)) {
    return false;
  }

  const dueDate = readDate(order.dueDate);

  if (!dueDate) {
    return false;
  }

  return startOfUtcDay(dueDate) < startOfUtcDay(referenceDate);
};

export const buildOrderWhereInput = (
  filters: OrderListQuery,
  referenceDate = new Date(),
): Prisma.WorkItemWhereInput => {
  const where: Prisma.WorkItemWhereInput = {};
  const and: Prisma.WorkItemWhereInput[] = [];
  const archiveState = archiveStateForFilters(filters);

  if (archiveState === "WITHOUT") {
    where.archivedAt = null;
  }

  if (archiveState === "ONLY") {
    where.archivedAt = { not: null };
  }

  if (filters.kind) {
    where.kind = filters.kind;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { notes: { contains: filters.q, mode: "insensitive" } },
      { customer: { name: { contains: filters.q, mode: "insensitive" } } },
      {
        owner: {
          is: { name: { contains: filters.q, mode: "insensitive" } },
        },
      },
    ];
  }

  if (filters.dueDateBucket) {
    const today = startOfUtcDay(referenceDate);
    const soonEnd = addUtcDays(today, 8);

    if (filters.dueDateBucket === "OVERDUE") {
      and.push({
        dueDate: { lt: today },
        status: { in: overdueStatuses },
      });
    }

    if (filters.dueDateBucket === "DUE_SOON") {
      and.push({
        dueDate: {
          gte: today,
          lt: soonEnd,
        },
        status: { in: openDueStatuses },
      });
    }

    if (filters.dueDateBucket === "UPCOMING") {
      and.push({
        dueDate: { gte: soonEnd },
        status: { in: openDueStatuses },
      });
    }

    if (filters.dueDateBucket === "NO_DUE_DATE") {
      and.push({ dueDate: null });
    }

    if (filters.dueDateBucket === "COMPLETED") {
      and.push({ status: WorkItemStatus.COMPLETED });
    }
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
};

export const sortOrdersForList = <TOrder extends {
  archivedAt: Date | null;
  dueDate: Date | null;
  priority: Priority;
  status: WorkItemStatus;
  updatedAt: Date;
}>(
  orders: TOrder[],
  referenceDate = new Date(),
) =>
  [...orders].sort((left, right) => {
    const leftOverdue = isOrderOverdue(left, referenceDate);
    const rightOverdue = isOrderOverdue(right, referenceDate);

    if (leftOverdue !== rightOverdue) {
      return leftOverdue ? -1 : 1;
    }

    const leftDue = left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    const priorityDifference =
      priorityRank[left.priority] - priorityRank[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

export const orderListOrderBy = [
  { dueDate: "asc" },
  { updatedAt: "desc" },
] satisfies Prisma.WorkItemOrderByWithRelationInput[];

export const toOrderApi = (order: OrderRecord, referenceDate = new Date()) => ({
  id: order.id,
  title: order.title,
  kind: order.kind,
  status: order.status,
  priority: order.priority,
  dueDate: order.dueDate,
  completedAt: order.completedAt,
  estimatedValueCents: order.estimatedValueCents,
  notes: order.notes,
  customerId: order.customerId,
  customer: order.customer,
  ownerId: order.ownerId,
  owner: order.owner,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  archivedAt: order.archivedAt,
  isOverdue: isOrderOverdue(order, referenceDate),
  counts: {
    inventoryItems: order._count.inventoryItems,
    issues: order._count.issues,
  },
});

export const buildOrderCompletionUpdate = (
  status: WorkItemStatus | undefined,
  existingOrder: WorkItemStatusSnapshot,
  now = new Date(),
): Pick<Prisma.WorkItemUpdateInput, "completedAt"> => {
  if (status === undefined) {
    return {};
  }

  if (status === WorkItemStatus.COMPLETED) {
    return existingOrder.completedAt ? {} : { completedAt: now };
  }

  return { completedAt: null };
};

export const createOrderData = ({
  customerId,
  ownerId,
  ...input
}: OrderCreateInput): Omit<Prisma.WorkItemCreateInput, "workspace"> => ({
  ...input,
  completedAt:
    input.status === WorkItemStatus.COMPLETED ? new Date() : null,
  customer: { connect: { id: customerId } },
  estimatedValueCents: input.estimatedValueCents ?? null,
  notes: input.notes ?? null,
  owner: { connect: { id: ownerId } },
});

export const updateOrderData = (
  { customerId, ownerId, ...input }: OrderUpdateInput,
  existingOrder: WorkItemStatusSnapshot,
): Prisma.WorkItemUpdateInput => ({
  ...input,
  ...buildOrderCompletionUpdate(input.status, existingOrder),
  ...customerRelation(customerId),
  ...ownerRelation(ownerId),
});

export const isAvailableOrderCustomer = async (
  prisma: PrismaClient,
  customerId: string,
  workspaceId: string,
) => {
  const customer = await prisma.customer.findFirst({
    select: { id: true },
    where: {
      workspaceId,
      archivedAt: null,
      id: customerId,
      status: { not: CustomerStatus.ARCHIVED },
    },
  });

  return Boolean(customer);
};

export const isActiveOrderOwner = async (
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

export const listOrderCustomerChoices = (prisma: PrismaClient, workspaceId: string) =>
  prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: orderCustomerSelect,
    where: {
      workspaceId,
      archivedAt: null,
      status: { not: CustomerStatus.ARCHIVED },
    },
  });

export const listOrderOwnerChoices = (prisma: PrismaClient) =>
  prisma.teamMember.findMany({
    orderBy: { name: "asc" },
    select: orderOwnerSelect,
    where: {
      archivedAt: null,
      status: TeamMemberStatus.ACTIVE,
    },
  });
