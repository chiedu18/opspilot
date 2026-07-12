import { WorkItemStatus } from "@/generated/prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireSandboxWorkspaceId } from "@/lib/sandbox/session";
import { validateInput, type ValidationResult } from "@/lib/validation/request";

import {
  buildOrderWhereInput,
  listOrderCustomerChoices,
  listOrderOwnerChoices,
  orderListOrderBy,
  orderSelect,
  sortOrdersForList,
  startOfUtcDay,
  toOrderApi,
} from "./order-data";
import {
  orderListQuerySchema,
  type OrderListQuery,
} from "./order-validation";
import type { OrderCustomerChoice, OrderOwnerChoice } from "./order-ui";

export type OrderSearchParams = Record<string, string | string[] | undefined>;

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const readOrderSearchParam = readSearchParam;

export const parseOrderListFilters = (
  searchParams: OrderSearchParams,
): ValidationResult<OrderListQuery> =>
  validateInput(orderListQuerySchema, {
    archiveState: readSearchParam(searchParams.archiveState),
    customerId: readSearchParam(searchParams.customerId),
    dueDateBucket: readSearchParam(searchParams.dueDateBucket),
    includeArchived: readSearchParam(searchParams.includeArchived),
    kind: readSearchParam(searchParams.kind),
    ownerId: readSearchParam(searchParams.ownerId),
    priority: readSearchParam(searchParams.priority),
    q: readSearchParam(searchParams.q),
    status: readSearchParam(searchParams.status),
  });

const includeCurrentCustomerChoice = (
  customer: OrderCustomerChoice,
  choices: OrderCustomerChoice[],
) => {
  if (choices.some((choice) => choice.id === customer.id)) {
    return choices;
  }

  return [customer, ...choices];
};

const includeCurrentOwnerChoice = (
  owner: OrderOwnerChoice | null,
  choices: OrderOwnerChoice[],
) => {
  if (!owner || choices.some((choice) => choice.id === owner.id)) {
    return choices;
  }

  return [owner, ...choices];
};

export const getOrderListPageData = async (filters: OrderListQuery) => {
  const prisma = getPrismaClient();
  const workspaceId = await requireSandboxWorkspaceId();
  const referenceDate = new Date();
  const today = startOfUtcDay(referenceDate);

  const [
    orders,
    openCount,
    overdueCount,
    blockedCount,
    archivedCount,
    customers,
    owners,
  ] = await Promise.all([
    prisma.workItem.findMany({
      orderBy: orderListOrderBy,
      select: orderSelect,
      take: 100,
      where: { AND: [{ workspaceId }, buildOrderWhereInput(filters, referenceDate)] },
    }),
    prisma.workItem.count({
      where: {
        workspaceId,
        archivedAt: null,
        status: {
          in: [
            WorkItemStatus.DRAFT,
            WorkItemStatus.ACTIVE,
            WorkItemStatus.BLOCKED,
          ],
        },
      },
    }),
    prisma.workItem.count({
      where: {
        workspaceId,
        archivedAt: null,
        dueDate: { lt: today },
        status: {
          in: [WorkItemStatus.ACTIVE, WorkItemStatus.BLOCKED],
        },
      },
    }),
    prisma.workItem.count({
      where: {
        workspaceId,
        archivedAt: null,
        status: WorkItemStatus.BLOCKED,
      },
    }),
    prisma.workItem.count({
      where: {
        workspaceId,
        archivedAt: { not: null },
      },
    }),
    listOrderCustomerChoices(prisma, workspaceId),
    listOrderOwnerChoices(prisma),
  ]);

  return {
    customers,
    metrics: {
      archived: archivedCount,
      blocked: blockedCount,
      open: openCount,
      overdue: overdueCount,
    },
    orders: sortOrdersForList(orders, referenceDate).map((order) =>
      toOrderApi(order, referenceDate),
    ),
    owners,
  };
};

export const getOrderCreatePageData = async () => {
  const prisma = getPrismaClient();
  const workspaceId = await requireSandboxWorkspaceId();
  const [customers, owners] = await Promise.all([
    listOrderCustomerChoices(prisma, workspaceId),
    listOrderOwnerChoices(prisma),
  ]);

  return { customers, owners };
};

export const getOrderDetail = async (id: string) => {
  const prisma = getPrismaClient();
  const workspaceId = await requireSandboxWorkspaceId();
  const order = await prisma.workItem.findFirst({
    select: orderSelect,
    where: { id, workspaceId },
  });

  return order ? toOrderApi(order) : null;
};

export const getOrderEditPageData = async (id: string) => {
  const prisma = getPrismaClient();
  const workspaceId = await requireSandboxWorkspaceId();
  const [orderRecord, customers, owners] = await Promise.all([
    prisma.workItem.findFirst({
      select: orderSelect,
      where: { id, workspaceId },
    }),
    listOrderCustomerChoices(prisma, workspaceId),
    listOrderOwnerChoices(prisma),
  ]);

  if (!orderRecord) {
    return null;
  }

  const order = toOrderApi(orderRecord);

  return {
    customers: includeCurrentCustomerChoice(order.customer, customers),
    order,
    owners: includeCurrentOwnerChoice(order.owner, owners),
  };
};
