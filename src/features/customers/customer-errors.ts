import { apiValidationError } from "@/lib/api/responses";

export const apiInvalidCustomerOwner = () =>
  apiValidationError({
    fieldErrors: {
      ownerId: ["Choose an active team member as the owner."],
    },
    formErrors: [],
  });

export const apiArchivedCustomerUpdate = () =>
  apiValidationError({
    fieldErrors: {
      status: ["Archived customers cannot be restored in this workflow."],
    },
    formErrors: [],
  });
