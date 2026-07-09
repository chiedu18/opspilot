import { apiError } from "@/lib/api/responses";

export const apiInvalidInventoryOwner = () =>
  apiError(
    "INVALID_INVENTORY_OWNER",
    "Choose an active owner for this inventory item.",
    { status: 400 },
    {
      fieldErrors: {
        ownerId: ["Choose an active owner."],
      },
      formErrors: [],
    },
  );

export const apiInvalidInventoryCustomer = () =>
  apiError(
    "INVALID_INVENTORY_CUSTOMER",
    "Choose an active customer for this inventory item.",
    { status: 400 },
    {
      fieldErrors: {
        customerId: ["Choose an active customer."],
      },
      formErrors: [],
    },
  );

export const apiInvalidInventoryWorkItem = () =>
  apiError(
    "INVALID_INVENTORY_ORDER",
    "Choose an active order for this inventory item.",
    { status: 400 },
    {
      fieldErrors: {
        workItemId: ["Choose an active order."],
      },
      formErrors: [],
    },
  );

export const apiInventoryRelationshipMismatch = () =>
  apiError(
    "INVENTORY_RELATIONSHIP_MISMATCH",
    "The selected order must belong to the selected customer.",
    { status: 400 },
    {
      fieldErrors: {
        customerId: ["Customer must match the selected order."],
        workItemId: ["Order must belong to the selected customer."],
      },
      formErrors: [],
    },
  );

export const apiInventoryAssignmentRequired = () =>
  apiError(
    "INVENTORY_ASSIGNMENT_REQUIRED",
    "Assigned or reserved inventory needs a related customer or order.",
    { status: 400 },
    {
      fieldErrors: {
        customerId: ["Choose a customer or order for assigned inventory."],
        workItemId: ["Choose a customer or order for assigned inventory."],
      },
      formErrors: [],
    },
  );

export const apiDuplicateInventoryReferenceCode = () =>
  apiError(
    "DUPLICATE_INVENTORY_REFERENCE_CODE",
    "Reference code must be unique.",
    { status: 400 },
    {
      fieldErrors: {
        referenceCode: ["Reference code must be unique."],
      },
      formErrors: [],
    },
  );

export const apiArchivedInventoryUpdate = () =>
  apiError(
    "ARCHIVED_INVENTORY_READ_ONLY",
    "Archived inventory items cannot be edited.",
    { status: 400 },
    {
      fieldErrors: {},
      formErrors: ["Archived inventory items cannot be edited."],
    },
  );
