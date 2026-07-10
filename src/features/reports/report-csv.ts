import type {
  InventoryReportRecord,
  IssuesReportRecord,
  OrdersReportRecord,
  ReportData,
} from "./report-data";
import {
  inventoryReportLabel,
  issueReportLabel,
  orderReportLabel,
} from "./report-ui";

type CsvColumn<TRow> = {
  header: string;
  value: (row: TRow) => string | number | boolean | Date | null | undefined;
};

export const csvEscape = (
  value: string | number | boolean | Date | null | undefined,
) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue =
    value instanceof Date ? value.toISOString() : String(value);

  if (!/[",\r\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll("\"", "\"\"")}"`;
};

export const buildCsv = <TRow>(columns: CsvColumn<TRow>[], rows: TRow[]) => {
  const headerLine = columns.map((column) => csvEscape(column.header)).join(",");
  const rowLines = rows.map((row) =>
    columns.map((column) => csvEscape(column.value(row))).join(","),
  );

  return [headerLine, ...rowLines].join("\r\n");
};
const dateValue = (date: Date | string | null | undefined) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const yesNo = (value: boolean) => (value ? "Yes" : "No");

const dollarsValue = (estimatedValueCents: number | null | undefined) => {
  if (estimatedValueCents === null || estimatedValueCents === undefined) {
    return "";
  }

  return (estimatedValueCents / 100).toFixed(2);
};

const ordersCsvColumns: CsvColumn<OrdersReportRecord>[] = [
  { header: "Work item", value: (row) => row.title },
  { header: "Kind", value: (row) => orderReportLabel.kind(row.kind) },
  { header: "Status", value: (row) => orderReportLabel.status(row.status) },
  {
    header: "Priority",
    value: (row) => orderReportLabel.priority(row.priority),
  },
  { header: "Customer", value: (row) => row.customer.name },
  { header: "Owner", value: (row) => row.owner?.name ?? "" },
  { header: "Due date", value: (row) => dateValue(row.dueDate) },
  { header: "Completed date", value: (row) => dateValue(row.completedAt) },
  {
    header: "Estimated value USD",
    value: (row) => dollarsValue(row.estimatedValueCents),
  },
  { header: "Overdue", value: (row) => yesNo(row.isOverdue) },
  { header: "Issue count", value: (row) => row.counts.issues },
  { header: "Inventory count", value: (row) => row.counts.inventoryItems },
  { header: "Archived", value: (row) => yesNo(Boolean(row.archivedAt)) },
  { header: "Updated date", value: (row) => dateValue(row.updatedAt) },
];

const issuesCsvColumns: CsvColumn<IssuesReportRecord>[] = [
  { header: "Issue", value: (row) => row.title },
  {
    header: "Category",
    value: (row) => issueReportLabel.category(row.category),
  },
  {
    header: "Priority",
    value: (row) => issueReportLabel.priority(row.priority),
  },
  { header: "Status", value: (row) => issueReportLabel.status(row.status) },
  { header: "Owner", value: (row) => row.owner?.name ?? "" },
  { header: "Customer", value: (row) => row.customer?.name ?? "" },
  { header: "Related order", value: (row) => row.workItem?.title ?? "" },
  { header: "Resolved", value: (row) => yesNo(row.isResolved) },
  { header: "Resolved date", value: (row) => dateValue(row.resolvedAt) },
  { header: "Archived", value: (row) => yesNo(Boolean(row.archivedAt)) },
  { header: "Updated date", value: (row) => dateValue(row.updatedAt) },
];

const inventoryCsvColumns: CsvColumn<InventoryReportRecord>[] = [
  { header: "Item", value: (row) => row.name },
  {
    header: "Category",
    value: (row) => inventoryReportLabel.category(row.category),
  },
  {
    header: "Status",
    value: (row) => inventoryReportLabel.status(row.status),
  },
  { header: "Quantity", value: (row) => row.quantity },
  { header: "Low stock threshold", value: (row) => row.lowStockThreshold },
  { header: "Low stock", value: (row) => yesNo(row.isLowStock) },
  { header: "Owner", value: (row) => row.owner?.name ?? "" },
  { header: "Customer", value: (row) => row.customer?.name ?? "" },
  { header: "Related order", value: (row) => row.workItem?.title ?? "" },
  { header: "Location", value: (row) => row.location ?? "" },
  { header: "Reference code", value: (row) => row.referenceCode ?? "" },
  { header: "Archived", value: (row) => yesNo(Boolean(row.archivedAt)) },
  { header: "Updated date", value: (row) => dateValue(row.updatedAt) },
];

export const getReportCsvColumns = (report: ReportData) => {
  if (report.report === "issues") {
    return issuesCsvColumns;
  }

  if (report.report === "inventory") {
    return inventoryCsvColumns;
  }

  return ordersCsvColumns;
};

export const buildReportCsv = (report: ReportData) => {
  if (report.report === "issues") {
    return buildCsv(issuesCsvColumns, report.rows);
  }

  if (report.report === "inventory") {
    return buildCsv(inventoryCsvColumns, report.rows);
  }

  return buildCsv(ordersCsvColumns, report.rows);
};

export type { CsvColumn };
