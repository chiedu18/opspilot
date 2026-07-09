export const inventoryCategoryOptions = [
  { label: "Device", tone: "info", value: "DEVICE" },
  { label: "License", tone: "demo", value: "LICENSE" },
  { label: "Marketing asset", tone: "warning", value: "MARKETING_ASSET" },
  { label: "SKU", tone: "neutral", value: "SKU" },
  { label: "Equipment", tone: "info", value: "EQUIPMENT" },
  { label: "Test account", tone: "demo", value: "TEST_ACCOUNT" },
  { label: "Software asset", tone: "success", value: "SOFTWARE_ASSET" },
  { label: "Other", tone: "neutral", value: "OTHER" },
] as const;

export const inventoryStatusOptions = [
  { label: "Available", tone: "success", value: "AVAILABLE" },
  { label: "Reserved", tone: "warning", value: "RESERVED" },
  { label: "Assigned", tone: "info", value: "ASSIGNED" },
  { label: "Low stock", tone: "danger", value: "LOW_STOCK" },
  { label: "Retired", tone: "neutral", value: "RETIRED" },
  { label: "Unavailable", tone: "danger", value: "UNAVAILABLE" },
] as const;

export const inventoryArchiveFilterOptions = [
  { label: "Active records", value: "WITHOUT" },
  { label: "Include archived", value: "WITH" },
  { label: "Archived only", value: "ONLY" },
] as const;

export const inventoryLowStockFilterOptions = [
  { label: "All stock states", value: "" },
  { label: "Low stock", value: "LOW_STOCK" },
  { label: "Stock ok", value: "OK" },
] as const;

export type InventoryCategoryValue =
  (typeof inventoryCategoryOptions)[number]["value"];
export type InventoryStatusValue =
  (typeof inventoryStatusOptions)[number]["value"];

export type InventoryCustomerChoice = {
  archivedAt: Date | string | null;
  id: string;
  name: string;
  status: string;
};

export type InventoryOwnerChoice = {
  email: string;
  id: string;
  name: string;
  role: string;
  status: string;
};

export type InventoryWorkItemChoice = {
  archivedAt: Date | string | null;
  customer: InventoryCustomerChoice;
  customerId: string;
  id: string;
  status: string;
  title: string;
};

export type InventoryFormValues = {
  category: InventoryCategoryValue;
  customerId: string;
  location: string;
  lowStockThreshold: string;
  name: string;
  notes: string;
  ownerId: string;
  quantity: string;
  referenceCode: string;
  status: InventoryStatusValue;
  workItemId: string;
};

const fallbackMeta = (value: string) => ({
  label: value,
  tone: "neutral",
  value,
});

export const inventoryCategoryMeta = (category: string) =>
  inventoryCategoryOptions.find((option) => option.value === category) ??
  fallbackMeta(category);

export const inventoryStatusMeta = (status: string) =>
  inventoryStatusOptions.find((option) => option.value === status) ??
  fallbackMeta(status);

export const formatInventoryDate = (
  date: Date | string | null | undefined,
) => {
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

export const formatInventoryDateTime = (
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

export const formatInventoryCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
