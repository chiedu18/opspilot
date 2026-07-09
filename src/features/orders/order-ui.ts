export const orderKindOptions = [
  { label: "Order", tone: "info", value: "ORDER" },
  { label: "Campaign", tone: "demo", value: "CAMPAIGN" },
  { label: "Service request", tone: "neutral", value: "SERVICE_REQUEST" },
] as const;

export const orderStatusOptions = [
  { label: "Draft", tone: "neutral", value: "DRAFT" },
  { label: "Active", tone: "info", value: "ACTIVE" },
  { label: "Blocked", tone: "warning", value: "BLOCKED" },
  { label: "Completed", tone: "success", value: "COMPLETED" },
  { label: "Cancelled", tone: "neutral", value: "CANCELLED" },
] as const;

export const orderPriorityOptions = [
  { label: "Low", tone: "neutral", value: "LOW" },
  { label: "Medium", tone: "info", value: "MEDIUM" },
  { label: "High", tone: "warning", value: "HIGH" },
  { label: "Urgent", tone: "danger", value: "URGENT" },
] as const;

export const orderArchiveFilterOptions = [
  { label: "Active records", value: "WITHOUT" },
  { label: "Include archived", value: "WITH" },
  { label: "Archived only", value: "ONLY" },
] as const;

export const orderDueDateBucketOptions = [
  { label: "All due dates", value: "" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Due soon", value: "DUE_SOON" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "No due date", value: "NO_DUE_DATE" },
] as const;

export type OrderKindValue = (typeof orderKindOptions)[number]["value"];
export type OrderStatusValue = (typeof orderStatusOptions)[number]["value"];
export type OrderPriorityValue = (typeof orderPriorityOptions)[number]["value"];

export type OrderCustomerChoice = {
  id: string;
  name: string;
  status: string;
  archivedAt: Date | string | null;
};

export type OrderOwnerChoice = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type OrderFormValues = {
  title: string;
  kind: OrderKindValue;
  status: OrderStatusValue;
  priority: OrderPriorityValue;
  dueDate: string;
  estimatedValueCents: string;
  customerId: string;
  ownerId: string;
  notes: string;
};

const fallbackMeta = (value: string) => ({
  label: value,
  tone: "neutral",
  value,
});

export const orderKindMeta = (kind: string) =>
  orderKindOptions.find((option) => option.value === kind) ?? fallbackMeta(kind);

export const orderStatusMeta = (status: string) =>
  orderStatusOptions.find((option) => option.value === status) ??
  fallbackMeta(status);

export const orderPriorityMeta = (priority: string) =>
  orderPriorityOptions.find((option) => option.value === priority) ??
  fallbackMeta(priority);

export const formatOrderDate = (date: Date | string | null | undefined) => {
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

export const formatOrderDateTime = (date: Date | string | null | undefined) => {
  if (!date) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(date));
};

export const formatOrderCurrency = (
  estimatedValueCents: number | null | undefined,
) => {
  if (estimatedValueCents === null || estimatedValueCents === undefined) {
    return "Not estimated";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(estimatedValueCents / 100);
};

export const formatOrderValueInput = (
  estimatedValueCents: number | null | undefined,
) => {
  if (estimatedValueCents === null || estimatedValueCents === undefined) {
    return "";
  }

  return (estimatedValueCents / 100).toFixed(2);
};

export const formatOrderDateInput = (
  date: Date | string | null | undefined,
) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};
