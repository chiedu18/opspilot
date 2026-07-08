import { CustomerStatus } from "@/generated/prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import { validateInput, type ValidationResult } from "@/lib/validation/request";

import {
  buildCustomerWhereInput,
  customerListOrderBy,
  customerSelect,
  listActiveCustomerOwners,
  toCustomerApi,
} from "./customer-data";
import {
  customerListQuerySchema,
  type CustomerListQuery,
} from "./customer-validation";

export type CustomerSearchParams = Record<
  string,
  string | string[] | undefined
>;

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const parseCustomerListFilters = (
  searchParams: CustomerSearchParams,
): ValidationResult<CustomerListQuery> =>
  validateInput(customerListQuerySchema, {
    includeArchived: readSearchParam(searchParams.includeArchived),
    ownerId: readSearchParam(searchParams.ownerId),
    q: readSearchParam(searchParams.q),
    status: readSearchParam(searchParams.status),
  });

export const readCustomerSearchParam = readSearchParam;

export const getCustomerListPageData = async (filters: CustomerListQuery) => {
  const prisma = getPrismaClient();

  const [customers, activeCount, prospectCount, pausedCount, archivedCount] =
    await Promise.all([
      prisma.customer.findMany({
        orderBy: customerListOrderBy,
        select: customerSelect,
        take: 100,
        where: buildCustomerWhereInput(filters),
      }),
      prisma.customer.count({
        where: {
          archivedAt: null,
          status: CustomerStatus.ACTIVE,
        },
      }),
      prisma.customer.count({
        where: {
          archivedAt: null,
          status: CustomerStatus.PROSPECT,
        },
      }),
      prisma.customer.count({
        where: {
          archivedAt: null,
          status: CustomerStatus.PAUSED,
        },
      }),
      prisma.customer.count({
        where: {
          status: CustomerStatus.ARCHIVED,
        },
      }),
    ]);

  return {
    customers: customers.map(toCustomerApi),
    metrics: {
      active: activeCount,
      archived: archivedCount,
      needsFollowUp: prospectCount + pausedCount,
      open: activeCount + prospectCount + pausedCount,
      paused: pausedCount,
      prospect: prospectCount,
    },
  };
};

export const getCustomerOwnerChoices = async () => {
  const prisma = getPrismaClient();
  return listActiveCustomerOwners(prisma);
};

export const getCustomerDetail = async (id: string) => {
  const prisma = getPrismaClient();
  const customer = await prisma.customer.findUnique({
    select: customerSelect,
    where: { id },
  });

  return customer ? toCustomerApi(customer) : null;
};
