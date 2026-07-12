import type { PrismaClient } from "@/generated/prisma/client";

import {
  findAvailableInventoryWorkItem,
  findInventoryByReferenceCode,
  hasInventoryAssignmentContext,
  isActiveInventoryOwner,
  isAvailableInventoryCustomer,
  type InventoryRelationshipSnapshot,
} from "./inventory-data";
import {
  apiDuplicateInventoryReferenceCode,
  apiInventoryAssignmentRequired,
  apiInventoryRelationshipMismatch,
  apiInvalidInventoryCustomer,
  apiInvalidInventoryOwner,
  apiInvalidInventoryWorkItem,
} from "./inventory-errors";
import type {
  InventoryCreateInput,
  InventoryUpdateInput,
} from "./inventory-validation";

type InventoryRelationshipInput =
  | InventoryCreateInput
  | InventoryUpdateInput;

type ValidateInventoryRelationshipsOptions = {
  existing?: InventoryRelationshipSnapshot;
  workspaceId?: string;
};

const readEffectiveRelation = (
  inputValue: string | null | undefined,
  existingValue: string | null | undefined,
) => (inputValue === undefined ? existingValue ?? null : inputValue);

export const validateInventoryRelationships = async (
  prisma: PrismaClient,
  input: InventoryRelationshipInput,
  options: ValidateInventoryRelationshipsOptions = {},
) => {
  const existing = options.existing;
  const { workspaceId } = options;
  const effectiveStatus = input.status ?? existing?.status;
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
    !hasInventoryAssignmentContext({
      customerId: effectiveCustomerId,
      status: effectiveStatus,
      workItemId: effectiveWorkItemId,
    })
  ) {
    return apiInventoryAssignmentRequired();
  }

  if (
    input.ownerId &&
    input.ownerId !== existing?.ownerId &&
    !(await isActiveInventoryOwner(prisma, input.ownerId))
  ) {
    return apiInvalidInventoryOwner();
  }

  if (
    input.customerId &&
    input.customerId !== existing?.customerId &&
    !(await isAvailableInventoryCustomer(prisma, input.customerId, workspaceId ?? ""))
  ) {
    return apiInvalidInventoryCustomer();
  }

  if (input.workItemId && input.workItemId !== existing?.workItemId) {
    const workItem = await findAvailableInventoryWorkItem(
      prisma,
      input.workItemId,
      workspaceId ?? "",
    );

    if (!workItem) {
      return apiInvalidInventoryWorkItem();
    }
  }

  if (effectiveWorkItemId && effectiveCustomerId) {
    const workItem = await prisma.workItem.findFirst({
      select: {
        customerId: true,
        id: true,
      },
      where: { id: effectiveWorkItemId, ...(workspaceId ? { workspaceId } : {}) },
    });

    if (!workItem) {
      return apiInvalidInventoryWorkItem();
    }

    if (workItem.customerId !== effectiveCustomerId) {
      return apiInventoryRelationshipMismatch();
    }
  }

  if (
    input.referenceCode &&
    input.referenceCode !== existing?.referenceCode &&
    (await findInventoryByReferenceCode(prisma, input.referenceCode, workspaceId ?? "", existing?.id))
  ) {
    return apiDuplicateInventoryReferenceCode();
  }

  return null;
};
