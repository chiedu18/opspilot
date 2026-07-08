export const customerStatusOptions = [
  { label: "Active", tone: "success", value: "ACTIVE" },
  { label: "Prospect", tone: "info", value: "PROSPECT" },
  { label: "Paused", tone: "warning", value: "PAUSED" },
  { label: "Archived", tone: "neutral", value: "ARCHIVED" },
] as const;

export const editableCustomerStatusOptions = customerStatusOptions.filter(
  (option) => option.value !== "ARCHIVED",
);

export const customerFilterOptions = [
  { label: "Open records", value: "" },
  ...customerStatusOptions,
] as const;

export type CustomerStatusValue = (typeof customerStatusOptions)[number]["value"];

export type CustomerFormValues = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  status: Exclude<CustomerStatusValue, "ARCHIVED">;
  ownerId: string;
  notes: string;
};

export type CustomerOwnerChoice = {
  id: string;
  name: string;
  email: string;
};

export const customerStatusMeta = (status: string) =>
  customerStatusOptions.find((option) => option.value === status) ?? {
    label: status,
    tone: "neutral",
    value: status,
  };

export const formatCustomerDate = (date: Date | string | null | undefined) => {
  if (!date) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(date));
};
