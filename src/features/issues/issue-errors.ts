import { apiError } from "@/lib/api/responses";

export const apiInvalidIssueOwner = () =>
  apiError(
    "INVALID_ISSUE_OWNER",
    "Choose an active owner for this issue.",
    { status: 400 },
    {
      fieldErrors: {
        ownerId: ["Choose an active owner."],
      },
      formErrors: [],
    },
  );

export const apiInvalidIssueCustomer = () =>
  apiError(
    "INVALID_ISSUE_CUSTOMER",
    "Choose an active customer for this issue.",
    { status: 400 },
    {
      fieldErrors: {
        customerId: ["Choose an active customer."],
      },
      formErrors: [],
    },
  );

export const apiInvalidIssueWorkItem = () =>
  apiError(
    "INVALID_ISSUE_ORDER",
    "Choose an active order for this issue.",
    { status: 400 },
    {
      fieldErrors: {
        workItemId: ["Choose an active order."],
      },
      formErrors: [],
    },
  );

export const apiIssueRelationshipMismatch = () =>
  apiError(
    "ISSUE_RELATIONSHIP_MISMATCH",
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

export const apiIssueResolutionRequired = () =>
  apiError(
    "ISSUE_RESOLUTION_REQUIRED",
    "Resolution notes are required when resolving or closing an issue.",
    { status: 400 },
    {
      fieldErrors: {
        resolutionNotes: [
          "Resolution notes are required when resolving or closing an issue.",
        ],
      },
      formErrors: [],
    },
  );

export const apiArchivedIssueUpdate = () =>
  apiError(
    "ARCHIVED_ISSUE_READ_ONLY",
    "Archived issues cannot be edited.",
    { status: 400 },
    {
      fieldErrors: {},
      formErrors: ["Archived issues cannot be edited."],
    },
  );
