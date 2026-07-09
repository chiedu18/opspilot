export const issueCategoryOptions = [
  { label: "Bug", tone: "danger", value: "BUG" },
  { label: "Support request", tone: "info", value: "SUPPORT_REQUEST" },
  { label: "Blocker", tone: "danger", value: "BLOCKER" },
  { label: "Fulfillment", tone: "warning", value: "FULFILLMENT" },
  { label: "Data quality", tone: "demo", value: "DATA_QUALITY" },
  { label: "Other", tone: "neutral", value: "OTHER" },
] as const;

export const issueStatusOptions = [
  { label: "Open", tone: "info", value: "OPEN" },
  { label: "In progress", tone: "demo", value: "IN_PROGRESS" },
  { label: "Blocked", tone: "danger", value: "BLOCKED" },
  { label: "Resolved", tone: "success", value: "RESOLVED" },
  { label: "Closed", tone: "neutral", value: "CLOSED" },
] as const;

export const issuePriorityOptions = [
  { label: "Low", tone: "neutral", value: "LOW" },
  { label: "Medium", tone: "info", value: "MEDIUM" },
  { label: "High", tone: "warning", value: "HIGH" },
  { label: "Urgent", tone: "danger", value: "URGENT" },
] as const;

export const issueArchiveFilterOptions = [
  { label: "Active records", value: "WITHOUT" },
  { label: "Include archived", value: "WITH" },
  { label: "Archived only", value: "ONLY" },
] as const;

export const issueResolutionFilterOptions = [
  { label: "All resolution states", value: "" },
  { label: "Unresolved", value: "UNRESOLVED" },
  { label: "Resolved or closed", value: "RESOLVED" },
] as const;

export type IssueCategoryValue =
  (typeof issueCategoryOptions)[number]["value"];
export type IssueStatusValue = (typeof issueStatusOptions)[number]["value"];
export type IssuePriorityValue =
  (typeof issuePriorityOptions)[number]["value"];

export type IssueCustomerChoice = {
  archivedAt: Date | string | null;
  id: string;
  name: string;
  status: string;
};

export type IssueOwnerChoice = {
  email: string;
  id: string;
  name: string;
  role: string;
  status: string;
};

export type IssueWorkItemChoice = {
  archivedAt: Date | string | null;
  customer: IssueCustomerChoice;
  customerId: string;
  id: string;
  status: string;
  title: string;
};

export type IssueFormValues = {
  category: IssueCategoryValue;
  customerId: string;
  description: string;
  ownerId: string;
  priority: IssuePriorityValue;
  resolutionNotes: string;
  status: IssueStatusValue;
  title: string;
  workItemId: string;
};

const fallbackMeta = (value: string) => ({
  label: value,
  tone: "neutral",
  value,
});

export const issueCategoryMeta = (category: string) =>
  issueCategoryOptions.find((option) => option.value === category) ??
  fallbackMeta(category);

export const issueStatusMeta = (status: string) =>
  issueStatusOptions.find((option) => option.value === status) ??
  fallbackMeta(status);

export const issuePriorityMeta = (priority: string) =>
  issuePriorityOptions.find((option) => option.value === priority) ??
  fallbackMeta(priority);

export const formatIssueDate = (date: Date | string | null | undefined) => {
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

export const formatIssueDateTime = (
  date: Date | string | null | undefined,
) => {
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

export const formatIssueCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
