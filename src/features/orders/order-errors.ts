import { apiError } from "@/lib/api/responses";

export const apiInvalidOrderCustomer = () =>
  apiError(
    "INVALID_ORDER_CUSTOMER",
    "Choose an active customer for this order.",
    { status: 400 },
    {
      fieldErrors: {
        customerId: ["Choose an active customer."],
      },
      formErrors: [],
    },
  );

export const apiInvalidOrderOwner = () =>
  apiError(
    "INVALID_ORDER_OWNER",
    "Choose an active owner for this order.",
    { status: 400 },
    {
      fieldErrors: {
        ownerId: ["Choose an active owner."],
      },
      formErrors: [],
    },
  );

export const apiArchivedOrderUpdate = () =>
  apiError(
    "ARCHIVED_ORDER_READ_ONLY",
    "Archived orders cannot be edited.",
    { status: 400 },
    {
      fieldErrors: {},
      formErrors: ["Archived orders cannot be edited."],
    },
  );
