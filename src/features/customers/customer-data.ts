import {
  CustomerStatus,
  TeamMemberStatus,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import type {
  CustomerCreateInput,
  CustomerListQuery,
  CustomerUpdateInput,
} from "./customer-validation";

export const customerSelect = {
  id: true,
  name: true,
  contactName: true,
  email: true,
  phone: true,
  status: true,
  ownerId: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  },
  notes: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  _count: {
    select: {
      workItems: true,
      inventoryItems: true,
      issues: true,
    },
  },
} satisfies Prisma.CustomerSelect;

export const customerOwnerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} satisfies Prisma.TeamMemberSelect;

type CustomerRecord = Prisma.CustomerGetPayload<{
  select: typeof customerSelect;
}>;

export type CustomerOwnerOption = Prisma.TeamMemberGetPayload<{
  select: typeof customerOwnerSelect;
}>;

const ownerRelation = (ownerId: string | null | undefined) => {
  if (ownerId === undefined) {
    return {};
  }

  if (ownerId === null) {
    return { owner: { disconnect: true } };
  }

  return { owner: { connect: { id: ownerId } } };
};

export const buildCustomerWhereInput = ({
  includeArchived,
  ownerId,
  q,
  status,
}: CustomerListQuery): Prisma.CustomerWhereInput => {
  const where: Prisma.CustomerWhereInput = {};

  if (!includeArchived && status !== CustomerStatus.ARCHIVED) {
    where.archivedAt = null;
  }

  if (status) {
    where.status = status;
  }

  if (ownerId) {
    where.ownerId = ownerId;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
};

export const customerListOrderBy = [
  { updatedAt: "desc" },
  { name: "asc" },
] satisfies Prisma.CustomerOrderByWithRelationInput[];

export const toCustomerApi = (customer: CustomerRecord) => ({
  id: customer.id,
  name: customer.name,
  contactName: customer.contactName,
  email: customer.email,
  phone: customer.phone,
  status: customer.status,
  ownerId: customer.ownerId,
  owner: customer.owner,
  notes: customer.notes,
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
  archivedAt: customer.archivedAt,
  counts: {
    workItems: customer._count.workItems,
    inventoryItems: customer._count.inventoryItems,
    issues: customer._count.issues,
  },
});

export const createCustomerData = ({
  ownerId,
  ...input
}: CustomerCreateInput): Prisma.CustomerCreateInput => ({
  ...input,
  ...ownerRelation(ownerId),
});

export const updateCustomerData = ({
  ownerId,
  ...input
}: CustomerUpdateInput): Prisma.CustomerUpdateInput => ({
  ...input,
  ...ownerRelation(ownerId),
});

export const isActiveTeamMember = async (
  prisma: PrismaClient,
  ownerId: string,
) => {
  const owner = await prisma.teamMember.findFirst({
    select: { id: true },
    where: {
      id: ownerId,
      archivedAt: null,
      status: TeamMemberStatus.ACTIVE,
    },
  });

  return Boolean(owner);
};

export const listActiveCustomerOwners = (prisma: PrismaClient) =>
  prisma.teamMember.findMany({
    orderBy: { name: "asc" },
    select: customerOwnerSelect,
    where: {
      archivedAt: null,
      status: TeamMemberStatus.ACTIVE,
    },
  });
