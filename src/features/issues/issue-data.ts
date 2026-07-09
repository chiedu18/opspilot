import {
  CustomerStatus,
  IssueStatus,
  Priority,
  TeamMemberStatus,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import type {
  IssueCreateInput,
  IssueListQuery,
  IssueResolutionState,
  IssueUpdateInput,
} from "./issue-validation";

export const issueCustomerSelect = {
  id: true,
  name: true,
  status: true,
  archivedAt: true,
} satisfies Prisma.CustomerSelect;

export const issueWorkItemSelect = {
  id: true,
  title: true,
  status: true,
  customerId: true,
  archivedAt: true,
  customer: {
    select: issueCustomerSelect,
  },
} satisfies Prisma.WorkItemSelect;

export const issueOwnerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} satisfies Prisma.TeamMemberSelect;

export const issueSelect = {
  id: true,
  title: true,
  category: true,
  priority: true,
  status: true,
  description: true,
  resolutionNotes: true,
  resolvedAt: true,
  ownerId: true,
  owner: {
    select: issueOwnerSelect,
  },
  customerId: true,
  customer: {
    select: issueCustomerSelect,
  },
  workItemId: true,
  workItem: {
    select: issueWorkItemSelect,
  },
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  _count: {
    select: {
      activityEvents: true,
    },
  },
} satisfies Prisma.IssueSelect;

type IssueRecord = Prisma.IssueGetPayload<{
  select: typeof issueSelect;
}>;

export type IssueCustomerOption = Prisma.CustomerGetPayload<{
  select: typeof issueCustomerSelect;
}>;

export type IssueWorkItemOption = Prisma.WorkItemGetPayload<{
  select: typeof issueWorkItemSelect;
}>;

export type IssueOwnerOption = Prisma.TeamMemberGetPayload<{
  select: typeof issueOwnerSelect;
}>;

export type IssueRelationshipSnapshot = {
  archivedAt: Date | null;
  customerId: string | null;
  id: string;
  ownerId: string | null;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  status: IssueStatus;
  workItemId: string | null;
};

type IssueResolvedAtSnapshot = {
  resolvedAt: Date | null;
  status: IssueStatus;
};

const resolvedIssueStatuses: IssueStatus[] = [
  IssueStatus.RESOLVED,
  IssueStatus.CLOSED,
];

const issueStatusRank: Record<IssueStatus, number> = {
  [IssueStatus.BLOCKED]: 0,
  [IssueStatus.OPEN]: 1,
  [IssueStatus.IN_PROGRESS]: 2,
  [IssueStatus.RESOLVED]: 3,
  [IssueStatus.CLOSED]: 4,
};

const issuePriorityRank: Record<Priority, number> = {
  [Priority.URGENT]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

const archiveStateForFilters = (
  filters: Pick<IssueListQuery, "archiveState" | "includeArchived">,
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

const ownerUpdateRelation = (id: string | undefined) => {
  if (id === undefined) {
    return {};
  }

  return { connect: { id } };
};

export const isResolvedIssueStatus = (status: IssueStatus) =>
  resolvedIssueStatuses.includes(status);

export const hasIssueResolutionNotes = ({
  resolutionNotes,
  status,
}: {
  resolutionNotes: string | null | undefined;
  status: IssueStatus;
}) =>
  !isResolvedIssueStatus(status) || Boolean(resolutionNotes?.trim());

export const buildIssueWhereInput = ({
  archiveState,
  category,
  customerId,
  includeArchived,
  ownerId,
  priority,
  q,
  resolutionState,
  status,
  workItemId,
}: IssueListQuery): Prisma.IssueWhereInput => {
  const where: Prisma.IssueWhereInput = {};
  const and: Prisma.IssueWhereInput[] = [];
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

  if (priority) {
    where.priority = priority;
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
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { resolutionNotes: { contains: q, mode: "insensitive" } },
      { customer: { is: { name: { contains: q, mode: "insensitive" } } } },
      { workItem: { is: { title: { contains: q, mode: "insensitive" } } } },
      { owner: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  if (resolutionState) {
    and.push(buildIssueResolutionWhereInput(resolutionState));
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
};

export const buildIssueResolutionWhereInput = (
  resolutionState: IssueResolutionState,
): Prisma.IssueWhereInput => {
  if (resolutionState === "RESOLVED") {
    return { status: { in: resolvedIssueStatuses } };
  }

  return { status: { notIn: resolvedIssueStatuses } };
};

export const sortIssuesForList = <TIssue extends {
  archivedAt: Date | null;
  priority: Priority;
  status: IssueStatus;
  updatedAt: Date;
}>(
  issues: TIssue[],
) =>
  [...issues].sort((left, right) => {
    const leftArchived = Boolean(left.archivedAt);
    const rightArchived = Boolean(right.archivedAt);

    if (leftArchived !== rightArchived) {
      return leftArchived ? 1 : -1;
    }

    const leftResolved = isResolvedIssueStatus(left.status);
    const rightResolved = isResolvedIssueStatus(right.status);

    if (leftResolved !== rightResolved) {
      return leftResolved ? 1 : -1;
    }

    const statusDifference =
      issueStatusRank[left.status] - issueStatusRank[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const priorityDifference =
      issuePriorityRank[left.priority] - issuePriorityRank[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

export const issueListOrderBy = [
  { updatedAt: "desc" },
  { title: "asc" },
] satisfies Prisma.IssueOrderByWithRelationInput[];

export const toIssueApi = (issue: IssueRecord) => ({
  id: issue.id,
  title: issue.title,
  category: issue.category,
  priority: issue.priority,
  status: issue.status,
  description: issue.description,
  resolutionNotes: issue.resolutionNotes,
  resolvedAt: issue.resolvedAt,
  ownerId: issue.ownerId,
  owner: issue.owner,
  customerId: issue.customerId,
  customer: issue.customer,
  workItemId: issue.workItemId,
  workItem: issue.workItem,
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
  archivedAt: issue.archivedAt,
  isResolved: isResolvedIssueStatus(issue.status),
  counts: {
    activityEvents: issue._count.activityEvents,
  },
});

export const buildIssueResolvedAtUpdate = (
  status: IssueStatus | undefined,
  existingIssue: IssueResolvedAtSnapshot,
  now = new Date(),
): Pick<Prisma.IssueUpdateInput, "resolvedAt"> => {
  if (status === undefined) {
    return {};
  }

  if (isResolvedIssueStatus(status)) {
    return existingIssue.resolvedAt ? {} : { resolvedAt: now };
  }

  return { resolvedAt: null };
};

export const createIssueData = ({
  customerId,
  ownerId,
  workItemId,
  ...input
}: IssueCreateInput): Prisma.IssueCreateInput => ({
  ...input,
  resolutionNotes: input.resolutionNotes ?? null,
  resolvedAt: isResolvedIssueStatus(input.status) ? new Date() : null,
  owner: { connect: { id: ownerId } },
  ...(customerId ? { customer: optionalCreateRelation(customerId) } : {}),
  ...(workItemId ? { workItem: optionalCreateRelation(workItemId) } : {}),
});

export const updateIssueData = (
  { customerId, ownerId, workItemId, ...input }: IssueUpdateInput,
  existingIssue: IssueResolvedAtSnapshot,
): Prisma.IssueUpdateInput => ({
  ...input,
  ...buildIssueResolvedAtUpdate(input.status, existingIssue),
  ...(customerId === undefined
    ? {}
    : { customer: optionalUpdateRelation(customerId) }),
  ...(ownerId === undefined ? {} : { owner: ownerUpdateRelation(ownerId) }),
  ...(workItemId === undefined
    ? {}
    : { workItem: optionalUpdateRelation(workItemId) }),
});

export const isActiveIssueOwner = async (
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

export const isAvailableIssueCustomer = async (
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

export const findAvailableIssueWorkItem = (
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

export const listIssueCustomerChoices = (prisma: PrismaClient) =>
  prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: issueCustomerSelect,
    where: {
      archivedAt: null,
      status: { not: CustomerStatus.ARCHIVED },
    },
  });

export const listIssueWorkItemChoices = (prisma: PrismaClient) =>
  prisma.workItem.findMany({
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
    select: issueWorkItemSelect,
    where: {
      archivedAt: null,
    },
  });

export const listIssueOwnerChoices = (prisma: PrismaClient) =>
  prisma.teamMember.findMany({
    orderBy: { name: "asc" },
    select: issueOwnerSelect,
    where: {
      archivedAt: null,
      status: TeamMemberStatus.ACTIVE,
    },
  });
