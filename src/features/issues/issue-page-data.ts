import { IssueStatus, Priority } from "@/generated/prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import { validateInput, type ValidationResult } from "@/lib/validation/request";

import {
  buildIssueWhereInput,
  isResolvedIssueStatus,
  issueListOrderBy,
  issueSelect,
  listIssueCustomerChoices,
  listIssueOwnerChoices,
  listIssueWorkItemChoices,
  sortIssuesForList,
  toIssueApi,
} from "./issue-data";
import {
  issueListQuerySchema,
  type IssueListQuery,
} from "./issue-validation";
import type {
  IssueCustomerChoice,
  IssueOwnerChoice,
  IssueWorkItemChoice,
} from "./issue-ui";

export type IssueSearchParams = Record<string, string | string[] | undefined>;

export type IssueRecordView = ReturnType<typeof toIssueApi>;

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const readIssueSearchParam = readSearchParam;

export const parseIssueListFilters = (
  searchParams: IssueSearchParams,
): ValidationResult<IssueListQuery> =>
  validateInput(issueListQuerySchema, {
    archiveState: readSearchParam(searchParams.archiveState),
    category: readSearchParam(searchParams.category),
    customerId: readSearchParam(searchParams.customerId),
    includeArchived: readSearchParam(searchParams.includeArchived),
    ownerId: readSearchParam(searchParams.ownerId),
    priority: readSearchParam(searchParams.priority),
    q: readSearchParam(searchParams.q),
    resolutionState: readSearchParam(searchParams.resolutionState),
    status: readSearchParam(searchParams.status),
    workItemId: readSearchParam(searchParams.workItemId),
  });

const includeCurrentCustomerChoice = (
  customer: IssueCustomerChoice | null,
  choices: IssueCustomerChoice[],
) => {
  if (!customer || choices.some((choice) => choice.id === customer.id)) {
    return choices;
  }

  return [customer, ...choices];
};

const includeCurrentOwnerChoice = (
  owner: IssueOwnerChoice | null,
  choices: IssueOwnerChoice[],
) => {
  if (!owner || choices.some((choice) => choice.id === owner.id)) {
    return choices;
  }

  return [owner, ...choices];
};

const includeCurrentWorkItemChoice = (
  workItem: IssueWorkItemChoice | null,
  choices: IssueWorkItemChoice[],
) => {
  if (!workItem || choices.some((choice) => choice.id === workItem.id)) {
    return choices;
  }

  return [workItem, ...choices];
};

const hasIssueListFilters = (filters: IssueListQuery) =>
  Boolean(
    filters.q ||
      filters.category ||
      filters.priority ||
      filters.status ||
      filters.customerId ||
      filters.workItemId ||
      filters.ownerId ||
      filters.resolutionState ||
      filters.archiveState !== "WITHOUT" ||
      filters.includeArchived,
  );

const highPriorityValues: Priority[] = [Priority.URGENT, Priority.HIGH];

export const getIssueListPageData = async (filters: IssueListQuery) => {
  const prisma = getPrismaClient();

  const [issues, metricIssues, archivedCount, customers, workItems, owners] =
    await Promise.all([
      prisma.issue.findMany({
        orderBy: issueListOrderBy,
        select: issueSelect,
        take: 200,
        where: buildIssueWhereInput(filters),
      }),
      prisma.issue.findMany({
        select: {
          priority: true,
          status: true,
        },
        where: {
          archivedAt: null,
        },
      }),
      prisma.issue.count({
        where: {
          archivedAt: { not: null },
        },
      }),
      listIssueCustomerChoices(prisma),
      listIssueWorkItemChoices(prisma),
      listIssueOwnerChoices(prisma),
    ]);

  const unresolvedIssues = metricIssues.filter(
    (issue) => !isResolvedIssueStatus(issue.status),
  );

  return {
    customers,
    hasFilters: hasIssueListFilters(filters),
    issues: sortIssuesForList(issues).map(toIssueApi),
    metrics: {
      archived: archivedCount,
      blocked: metricIssues.filter(
        (issue) => issue.status === IssueStatus.BLOCKED,
      ).length,
      highPriority: unresolvedIssues.filter((issue) =>
        highPriorityValues.includes(issue.priority),
      ).length,
      tracked: metricIssues.length,
      unresolved: unresolvedIssues.length,
    },
    owners,
    workItems,
  };
};

export const getIssueCreatePageData = async () => {
  const prisma = getPrismaClient();
  const [customers, workItems, owners] = await Promise.all([
    listIssueCustomerChoices(prisma),
    listIssueWorkItemChoices(prisma),
    listIssueOwnerChoices(prisma),
  ]);

  return { customers, owners, workItems };
};

export const getIssueDetail = async (id: string) => {
  const prisma = getPrismaClient();
  const issue = await prisma.issue.findUnique({
    select: issueSelect,
    where: { id },
  });

  return issue ? toIssueApi(issue) : null;
};

export const getIssueEditPageData = async (id: string) => {
  const prisma = getPrismaClient();
  const [issueRecord, customers, workItems, owners] = await Promise.all([
    prisma.issue.findUnique({
      select: issueSelect,
      where: { id },
    }),
    listIssueCustomerChoices(prisma),
    listIssueWorkItemChoices(prisma),
    listIssueOwnerChoices(prisma),
  ]);

  if (!issueRecord) {
    return null;
  }

  const issue = toIssueApi(issueRecord);

  return {
    customers: includeCurrentCustomerChoice(issue.customer, customers),
    issue,
    owners: includeCurrentOwnerChoice(issue.owner, owners),
    workItems: includeCurrentWorkItemChoice(issue.workItem, workItems),
  };
};
