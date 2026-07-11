import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  InventoryCategoryBadge,
  InventoryLowStockBadge,
  InventoryStatusBadge,
} from "@/features/inventory/inventory-badges";
import {
  inventoryCategoryOptions,
  inventoryStatusOptions,
} from "@/features/inventory/inventory-ui";
import {
  IssueCategoryBadge,
  IssuePriorityBadge,
  IssueResolutionBadge,
  IssueStatusBadge,
} from "@/features/issues/issue-badges";
import {
  issueCategoryOptions,
  issuePriorityOptions,
  issueStatusOptions,
} from "@/features/issues/issue-ui";
import {
  OrderKindBadge,
  OrderOverdueBadge,
  OrderPriorityBadge,
  OrderStatusBadge,
} from "@/features/orders/order-badges";
import {
  orderKindOptions,
  orderPriorityOptions,
  orderStatusOptions,
} from "@/features/orders/order-ui";
import {
  getReportData,
  getReportFilterChoices,
  getReportSummaryLabel,
  isReportEmpty,
  parseReportFilters,
  reportQueryToSearchParams,
  type InventoryReportData,
  type IssuesReportData,
  type OrdersReportData,
  type ReportData,
  type ReportSearchParams,
} from "@/features/reports/report-data";
import {
  formatReportCount,
  formatReportCurrency,
  formatReportDate,
  formatReportDateInput,
  inventoryReportLabel,
  issueReportLabel,
  orderReportLabel,
  reportArchiveFilterOptions,
  reportDueDateBucketOptions,
  reportLowStockFilterOptions,
  reportResolutionFilterOptions,
  reportTypeMeta,
  reportTypeOptions,
} from "@/features/reports/report-ui";
import { ExportReportLink } from "@/features/reports/export-report-link";

type ReportsPageProps = {
  searchParams?: Promise<ReportSearchParams>;
};

const inputClass =
  "op-field h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none";

const actionLinkClass =
  "op-button op-button-secondary px-3";

type ReportFilterChoices = Awaited<ReturnType<typeof getReportFilterChoices>>;

const reportHref = (report: ReportData["report"]) => `/reports?report=${report}`;

const exportHref = (report: ReportData) =>
  `/api/reports/export?${reportQueryToSearchParams(report.filters).toString()}`;

const metricCardsForReport = (report: ReportData) => {
  if (report.report === "orders") {
    return [
      { label: "Rows", tone: "default", value: report.metrics.rows },
      { label: "Overdue", tone: "danger", value: report.metrics.overdue },
      {
        label: "Estimated value",
        tone: "default",
        value: formatReportCurrency(report.metrics.totalValueCents),
      },
    ];
  }

  if (report.report === "issues") {
    return [
      { label: "Rows", tone: "default", value: report.metrics.rows },
      {
        label: "Unresolved",
        tone: "warning",
        value: report.metrics.unresolved,
      },
      {
        label: "High priority",
        tone: "danger",
        value: report.metrics.highPriority,
      },
    ];
  }

  return [
    { label: "Rows", tone: "default", value: report.metrics.rows },
    { label: "Total quantity", tone: "default", value: report.metrics.quantity },
    { label: "Low stock", tone: "danger", value: report.metrics.lowStock },
  ];
};

const metricToneClass = (tone: string) => {
  if (tone === "danger") {
    return "text-[#b91c1c]";
  }

  if (tone === "warning") {
    return "text-[#b45309]";
  }

  return "text-[#0f172a]";
};

function ReportTabs({ activeReport }: { activeReport: ReportData["report"] }) {
  return (
    <div className="op-report-tabs grid gap-3 lg:grid-cols-3">
      {reportTypeOptions.map((option) => {
        const isActive = option.value === activeReport;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`op-report-tab op-tab-card rounded-lg border px-4 py-3 ${
              isActive
                ? "border-[#0f766e] bg-[#f0fdfa]"
                : "border-[#d9e1ea] bg-white hover:bg-[#f8fafc]"
            }`}
            href={reportHref(option.value)}
            key={option.value}
          >
            <div className="text-sm font-semibold text-[#0f172a]">
              {option.label}
            </div>
            <div className="mt-1 text-xs leading-5 text-[#64748b]">
              {option.description}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ReportMetrics({ report }: { report: ReportData }) {
  return (
    <div className="op-report-metrics grid gap-3 sm:grid-cols-3">
      {metricCardsForReport(report).map((metric) => (
        <div
          className="op-report-metric op-static-card rounded-lg px-4 py-3"
          key={metric.label}
        >
          <div className="text-xs font-medium uppercase text-[#64748b]">
            {metric.label}
          </div>
          <div
            className={`mt-1 text-lg font-semibold ${metricToneClass(
              metric.tone,
            )}`}
          >
            {typeof metric.value === "number"
              ? formatReportCount(metric.value)
              : metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommonFilters({
  choices,
  report,
}: {
  choices: ReportFilterChoices;
  report: ReportData;
}) {
  return (
    <>
      <div>
        <label className="text-xs font-semibold uppercase text-[#64748b]" htmlFor="q">
          Search
        </label>
        <input
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.q ?? ""}
          id="q"
          name="q"
          placeholder={
            report.report === "inventory"
              ? "Name, code, customer, order, owner"
              : "Title, customer, order, owner"
          }
        />
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="customerId"
        >
          Customer
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.customerId ?? ""}
          id="customerId"
          name="customerId"
        >
          <option value="">All customers</option>
          {choices.customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="ownerId"
        >
          Owner
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.ownerId ?? ""}
          id="ownerId"
          name="ownerId"
        >
          <option value="">All owners</option>
          {choices.owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="archiveState"
        >
          Archive visibility
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.archiveState}
          id="archiveState"
          name="archiveState"
        >
          {reportArchiveFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function RelatedOrderFilter({
  choices,
  value,
}: {
  choices: ReportFilterChoices;
  value: string | undefined;
}) {
  return (
    <div>
      <label
        className="text-xs font-semibold uppercase text-[#64748b]"
        htmlFor="workItemId"
      >
        Related order
      </label>
      <select
        className={`${inputClass} mt-1 w-full`}
        defaultValue={value ?? ""}
        id="workItemId"
        name="workItemId"
      >
        <option value="">All orders</option>
        {choices.workItems.map((workItem) => (
          <option key={workItem.id} value={workItem.id}>
            {workItem.title} - {workItem.customer.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function OrdersFilters({ report }: { report: OrdersReportData }) {
  return (
    <>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="status"
        >
          Status
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.status ?? ""}
          id="status"
          name="status"
        >
          <option value="">All statuses</option>
          {orderStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="priority"
        >
          Priority
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.priority ?? ""}
          id="priority"
          name="priority"
        >
          <option value="">All priorities</option>
          {orderPriorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="kind"
        >
          Kind
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.kind ?? ""}
          id="kind"
          name="kind"
        >
          <option value="">All kinds</option>
          {orderKindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="dueDateBucket"
        >
          Due date
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.dueDateBucket ?? ""}
          id="dueDateBucket"
          name="dueDateBucket"
        >
          {reportDueDateBucketOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="dueFrom"
        >
          Due from
        </label>
        <input
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.dueFrom ?? ""}
          id="dueFrom"
          name="dueFrom"
          type="date"
        />
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="dueTo"
        >
          Due to
        </label>
        <input
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.dueTo ?? ""}
          id="dueTo"
          name="dueTo"
          type="date"
        />
      </div>
    </>
  );
}

function IssuesFilters({
  choices,
  report,
}: {
  choices: ReportFilterChoices;
  report: IssuesReportData;
}) {
  return (
    <>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="category"
        >
          Category
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.category ?? ""}
          id="category"
          name="category"
        >
          <option value="">All categories</option>
          {issueCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="priority"
        >
          Priority
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.priority ?? ""}
          id="priority"
          name="priority"
        >
          <option value="">All priorities</option>
          {issuePriorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="status"
        >
          Status
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.status ?? ""}
          id="status"
          name="status"
        >
          <option value="">All statuses</option>
          {issueStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <RelatedOrderFilter choices={choices} value={report.filters.workItemId} />
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="resolutionState"
        >
          Resolution
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.resolutionState ?? ""}
          id="resolutionState"
          name="resolutionState"
        >
          {reportResolutionFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function InventoryFilters({
  choices,
  report,
}: {
  choices: ReportFilterChoices;
  report: InventoryReportData;
}) {
  return (
    <>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="category"
        >
          Category
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.category ?? ""}
          id="category"
          name="category"
        >
          <option value="">All categories</option>
          {inventoryCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="status"
        >
          Status
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.status ?? ""}
          id="status"
          name="status"
        >
          <option value="">All statuses</option>
          {inventoryStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <RelatedOrderFilter choices={choices} value={report.filters.workItemId} />
      <div>
        <label
          className="text-xs font-semibold uppercase text-[#64748b]"
          htmlFor="lowStockState"
        >
          Low stock
        </label>
        <select
          className={`${inputClass} mt-1 w-full`}
          defaultValue={report.filters.lowStockState ?? ""}
          id="lowStockState"
          name="lowStockState"
        >
          {reportLowStockFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function ReportFilters({
  choices,
  report,
}: {
  choices: ReportFilterChoices;
  report: ReportData;
}) {
  return (
    <form
      className="op-report-filters grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_repeat(4,minmax(150px,1fr))] 2xl:grid-cols-[minmax(220px,1.2fr)_repeat(8,minmax(140px,1fr))_auto_auto] 2xl:items-end"
      key={reportQueryToSearchParams(report.filters).toString()}
    >
      <input name="report" type="hidden" value={report.report} />
      <CommonFilters choices={choices} report={report} />
      {report.report === "orders" ? <OrdersFilters report={report} /> : null}
      {report.report === "issues" ? (
        <IssuesFilters choices={choices} report={report} />
      ) : null}
      {report.report === "inventory" ? (
        <InventoryFilters choices={choices} report={report} />
      ) : null}
      <button
        className="op-button op-button-primary h-10 px-4"
        type="submit"
      >
        Apply
      </button>
      <Link
        className="op-button op-button-secondary h-10 px-4"
        href={reportHref(report.report)}
      >
        Reset
      </Link>
    </form>
  );
}

function OrdersReportTable({ report }: { report: OrdersReportData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
        <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
          <tr>
            <th className="px-4 py-3 font-semibold">Work item</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Owner</th>
            <th className="px-4 py-3 font-semibold">Due</th>
            <th className="px-4 py-3 font-semibold">Value</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Kind</th>
            <th className="px-4 py-3 font-semibold">Related</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {report.rows.map((order) => (
            <tr className="op-table-row align-top" key={order.id}>
              <td className="px-4 py-3">
                <Link
                  className="op-text-link"
                  href={`/orders/${order.id}`}
                >
                  {order.title}
                </Link>
                <div className="mt-1 text-xs text-[#64748b]">
                  {order.archivedAt ? "Archived" : orderReportLabel.status(order.status)}
                </div>
              </td>
              <td className="px-4 py-3 text-[#334155]">
                {order.customer.name}
              </td>
              <td className="px-4 py-3 text-[#334155]">
                {order.owner?.name ?? "Unassigned"}
              </td>
              <td className="px-4 py-3">
                <div className="text-[#334155]">
                  {formatReportDate(order.dueDate)}
                </div>
                <div className="mt-2">
                  {order.isOverdue ? (
                    <OrderOverdueBadge />
                  ) : (
                    <span className="text-xs text-[#64748b]">
                      On schedule
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-[#475569]">
                {formatReportCurrency(order.estimatedValueCents)}
              </td>
              <td className="px-4 py-3">
                <OrderStatusBadge value={order.status} />
              </td>
              <td className="px-4 py-3">
                <OrderPriorityBadge value={order.priority} />
              </td>
              <td className="px-4 py-3">
                <OrderKindBadge value={order.kind} />
              </td>
              <td className="px-4 py-3 text-xs text-[#475569]">
                <div>{formatReportCount(order.counts.issues)} issues</div>
                <div>
                  {formatReportCount(order.counts.inventoryItems)} assets
                </div>
              </td>
              <td className="px-4 py-3 text-[#475569]">
                {formatReportDate(order.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssuesReportTable({ report }: { report: IssuesReportData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
        <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
          <tr>
            <th className="px-4 py-3 font-semibold">Issue</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Owner</th>
            <th className="px-4 py-3 font-semibold">Related</th>
            <th className="px-4 py-3 font-semibold">Resolved</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {report.rows.map((issue) => (
            <tr
              className={`op-table-row align-top ${
                !issue.isResolved &&
                (issue.priority === "HIGH" ||
                  issue.priority === "URGENT" ||
                  issue.status === "BLOCKED")
                  ? "bg-[#fff7ed]"
                  : ""
              }`}
              key={issue.id}
            >
              <td className="px-4 py-3">
                <Link
                  className="op-text-link"
                  href={`/issues/${issue.id}`}
                >
                  {issue.title}
                </Link>
                <div className="mt-1 text-xs text-[#64748b]">
                  {issue.archivedAt
                    ? "Archived"
                    : issueReportLabel.status(issue.status)}
                </div>
              </td>
              <td className="px-4 py-3">
                <IssueCategoryBadge value={issue.category} />
              </td>
              <td className="px-4 py-3">
                <IssuePriorityBadge value={issue.priority} />
              </td>
              <td className="px-4 py-3">
                <IssueStatusBadge value={issue.status} />
              </td>
              <td className="px-4 py-3 text-[#334155]">
                {issue.owner?.name ?? "Unassigned"}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-[#334155]">
                  {issue.customer ? (
                    <Link
                      className="op-text-link"
                      href={`/customers/${issue.customer.id}`}
                    >
                      {issue.customer.name}
                    </Link>
                  ) : (
                    "No customer"
                  )}
                </div>
                <div className="mt-1 text-xs text-[#64748b]">
                  {issue.workItem ? (
                    <Link
                      className="op-text-link"
                      href={`/orders/${issue.workItem.id}`}
                    >
                      {issue.workItem.title}
                    </Link>
                  ) : (
                    "No related order"
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <IssueResolutionBadge isResolved={issue.isResolved} />
                <div className="mt-2 text-xs text-[#64748b]">
                  {formatReportDate(issue.resolvedAt)}
                </div>
              </td>
              <td className="px-4 py-3 text-[#475569]">
                {formatReportDate(issue.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryReportTable({ report }: { report: InventoryReportData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1380px] border-collapse text-left text-sm">
        <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
          <tr>
            <th className="px-4 py-3 font-semibold">Item</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Quantity</th>
            <th className="px-4 py-3 font-semibold">Stock</th>
            <th className="px-4 py-3 font-semibold">Owner</th>
            <th className="px-4 py-3 font-semibold">Related</th>
            <th className="px-4 py-3 font-semibold">Location/code</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {report.rows.map((item) => (
            <tr className="op-table-row align-top" key={item.id}>
              <td className="px-4 py-3">
                <Link
                  className="op-text-link"
                  href={`/inventory/${item.id}`}
                >
                  {item.name}
                </Link>
                <div className="mt-1 text-xs text-[#64748b]">
                  {item.archivedAt
                    ? "Archived"
                    : inventoryReportLabel.status(item.status)}
                </div>
              </td>
              <td className="px-4 py-3">
                <InventoryCategoryBadge value={item.category} />
              </td>
              <td className="px-4 py-3">
                <InventoryStatusBadge value={item.status} />
              </td>
              <td className="px-4 py-3 text-[#334155]">
                <div className="font-semibold">
                  {formatReportCount(item.quantity)}
                </div>
                <div className="mt-1 text-xs text-[#64748b]">
                  Threshold {formatReportCount(item.lowStockThreshold)}
                </div>
              </td>
              <td className="px-4 py-3">
                <InventoryLowStockBadge isLowStock={item.isLowStock} />
              </td>
              <td className="px-4 py-3 text-[#334155]">
                {item.owner?.name ?? "Unassigned"}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-[#334155]">
                  {item.customer ? (
                    <Link
                      className="op-text-link"
                      href={`/customers/${item.customer.id}`}
                    >
                      {item.customer.name}
                    </Link>
                  ) : (
                    "No customer"
                  )}
                </div>
                <div className="mt-1 text-xs text-[#64748b]">
                  {item.workItem ? (
                    <Link
                      className="op-text-link"
                      href={`/orders/${item.workItem.id}`}
                    >
                      {item.workItem.title}
                    </Link>
                  ) : (
                    "No related order"
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-[#334155]">
                  {item.location ?? "No location"}
                </div>
                <div className="mt-1 text-xs text-[#64748b]">
                  {item.referenceCode ?? "No code"}
                </div>
              </td>
              <td className="px-4 py-3 text-[#475569]">
                {formatReportDate(item.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ report }: { report: ReportData }) {
  if (isReportEmpty(report)) {
    return (
      <div className="px-4 py-4">
        <EmptyState
          actionHref="/reports"
          actionLabel="Reset report filters"
          description="Try changing filters, or export the current view to get a header-only CSV with the selected column contract."
          title="No report rows"
        />
      </div>
    );
  }

  if (report.report === "issues") {
    return <IssuesReportTable report={report} />;
  }

  if (report.report === "inventory") {
    return <InventoryReportTable report={report} />;
  }

  return <OrdersReportTable report={report} />;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseReportFilters(params);

  if (!filters.success) {
    return (
      <section className="op-reports-page space-y-7">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
            Report filters could not be applied.
          </p>
        </div>
        <ErrorState
          description="Reset the report filters and try loading reports again."
          title="Reports unavailable"
        />
        <Link className={actionLinkClass} href="/reports">
          Reset filters
        </Link>
      </section>
    );
  }

  const [report, choices] = await Promise.all([
    getReportData(filters.data),
    getReportFilterChoices(filters.data.report),
  ]);
  const meta = reportTypeMeta(report.report);

  return (
    <section className="op-reports-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="op-header-eyebrow">Analysis workspace</p>
          <h2 className="mt-2 text-xl font-semibold">Reports</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Filtered demo operations reports for orders, issues, inventory, and
            spreadsheet-friendly CSV export.
          </p>
        </div>
        <ExportReportLink
          href={exportHref(report)}
          label={isReportEmpty(report) ? "Export header-only CSV" : "Export CSV"}
        />
      </div>

      <ReportTabs activeReport={report.report} />
      <ReportMetrics report={report} />

      <div className="op-report-surface overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
        <div className="op-report-filter-deck border-b border-[#d9e1ea] px-4 py-3">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-semibold">{meta.label} report filters</h3>
              <p className="op-filter-summary mt-1 text-sm text-[#64748b]">
                {getReportSummaryLabel(report)}
              </p>
            </div>
            <p className="text-xs font-medium uppercase text-[#64748b]">
              {formatReportCount(report.rows.length)} rows in preview
            </p>
          </div>
          <ReportFilters choices={choices} report={report} />
        </div>

        <div className="op-report-preview-header flex items-center justify-between gap-4 border-b border-[#d9e1ea] px-4 py-3">
          <div>
            <h3 className="font-semibold">{meta.label} report preview</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              CSV export uses the same active filters and readable column
              headers.
            </p>
          </div>
          {report.report === "orders" ? (
            <p className="text-sm text-[#64748b]">
              Due range:{" "}
              {formatReportDateInput(report.filters.dueFrom) || "Any"} to{" "}
              {formatReportDateInput(report.filters.dueTo) || "Any"}
            </p>
          ) : null}
        </div>

        <ReportTable report={report} />
      </div>
    </section>
  );
}
