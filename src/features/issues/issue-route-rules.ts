import type { PrismaClient } from "@/generated/prisma/client";

import {
  findAvailableIssueWorkItem,
  hasIssueResolutionNotes,
  isActiveIssueOwner,
  isAvailableIssueCustomer,
  type IssueRelationshipSnapshot,
} from "./issue-data";
import {
  apiInvalidIssueCustomer,
  apiInvalidIssueOwner,
  apiInvalidIssueWorkItem,
  apiIssueRelationshipMismatch,
  apiIssueResolutionRequired,
} from "./issue-errors";
import type {
  IssueCreateInput,
  IssueUpdateInput,
} from "./issue-validation";

type IssueRelationshipInput = IssueCreateInput | IssueUpdateInput;

type ValidateIssueRelationshipsOptions = {
  existing?: IssueRelationshipSnapshot;
};

const readEffectiveRelation = (
  inputValue: string | null | undefined,
  existingValue: string | null | undefined,
) => (inputValue === undefined ? existingValue ?? null : inputValue);

export const validateIssueRelationships = async (
  prisma: PrismaClient,
  input: IssueRelationshipInput,
  options: ValidateIssueRelationshipsOptions = {},
) => {
  const existing = options.existing;
  const effectiveStatus = input.status ?? existing?.status;
  const effectiveResolutionNotes =
    input.resolutionNotes === undefined
      ? existing?.resolutionNotes ?? null
      : input.resolutionNotes;
  const effectiveCustomerId = readEffectiveRelation(
    input.customerId,
    existing?.customerId,
  );
  const effectiveWorkItemId = readEffectiveRelation(
    input.workItemId,
    existing?.workItemId,
  );

  if (
    effectiveStatus &&
    !hasIssueResolutionNotes({
      resolutionNotes: effectiveResolutionNotes,
      status: effectiveStatus,
    })
  ) {
    return apiIssueResolutionRequired();
  }

  if (
    input.ownerId &&
    input.ownerId !== existing?.ownerId &&
    !(await isActiveIssueOwner(prisma, input.ownerId))
  ) {
    return apiInvalidIssueOwner();
  }

  if (
    input.customerId &&
    input.customerId !== existing?.customerId &&
    !(await isAvailableIssueCustomer(prisma, input.customerId))
  ) {
    return apiInvalidIssueCustomer();
  }

  if (input.workItemId && input.workItemId !== existing?.workItemId) {
    const workItem = await findAvailableIssueWorkItem(prisma, input.workItemId);

    if (!workItem) {
      return apiInvalidIssueWorkItem();
    }
  }

  if (effectiveWorkItemId && effectiveCustomerId) {
    const workItem = await prisma.workItem.findUnique({
      select: {
        customerId: true,
        id: true,
      },
      where: { id: effectiveWorkItemId },
    });

    if (!workItem) {
      return apiInvalidIssueWorkItem();
    }

    if (workItem.customerId !== effectiveCustomerId) {
      return apiIssueRelationshipMismatch();
    }
  }

  return null;
};
