import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DashboardSummary } from "@/features/dashboard/dashboard-data";
import { InventoryStatusBadge } from "@/features/inventory/inventory-badges";
import {
  formatInventoryCount,
} from "@/features/inventory/inventory-ui";
import {
  IssueAttentionBadge,
  IssuePriorityBadge,
  IssueStatusBadge,
} from "@/features/issues/issue-badges";
import { formatIssueDate } from "@/features/issues/issue-ui";
import {
  OrderPriorityBadge,
  OrderStatusBadge,
} from "@/features/orders/order-badges";
import {
  formatOrderDate,
  orderStatusMeta,
} from "@/features/orders/order-ui";
import { InventoryStatus, WorkItemStatus } from "@/generated/prisma/client";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatCount = (value: number) => numberFormatter.format(value);

const metricToneClasses = {
  danger: "text-[#b91c1c]",
  info: "text-[#2563eb]",
  success: "text-[#15803d]",
  teal: "text-[#0f766e]",
  warning: "text-[#b45309]",
} as const;

const statusBarClasses: Record<WorkItemStatus, string> = {
  [WorkItemStatus.ACTIVE]: "bg-[#2563eb]",
  [WorkItemStatus.BLOCKED]: "bg-[#b91c1c]",
  [WorkItemStatus.CANCELLED]: "bg-[#64748b]",
  [WorkItemStatus.COMPLETED]: "bg-[#15803d]",
  [WorkItemStatus.DRAFT]: "bg-[#0f766e]",
};

const actionLinkClass =
  "op-button op-button-secondary px-3";

type MetricCardProps = {
  label: string;
  value: number;
  tone: keyof typeof metricToneClasses;
  detail: string;
  featured?: boolean;
};

function MetricCard({ detail, featured, label, tone, value }: MetricCardProps) {
  const formattedValue = formatCount(value);

  return (
    <div
      aria-label={`${label}: ${formattedValue}`}
      className={`op-command-metric op-dashboard-metric op-static-card rounded-2xl p-5 ${
        featured ? "op-command-metric-featured" : ""
      }`}
      role="group"
    >
      <div className="text-sm font-medium text-[#64748b]">{label}</div>
      <div
        className={`mt-4 text-3xl font-semibold tracking-[-0.05em] ${metricToneClasses[tone]}`}
      >
        {formattedValue}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">{detail}</p>
    </div>
  );
}

type DashboardViewProps = {
  summary: DashboardSummary;
};

type PanelHeaderProps = {
  actionHref: string;
  actionLabel: string;
  count: number;
  title: string;
};

function PanelHeader({
  actionHref,
  actionLabel,
  count,
  title,
}: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#d9e1ea] px-4 py-3">
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-[#64748b]">
          {formatCount(count)} tracked
        </p>
      </div>
      <Link className={actionLinkClass} href={actionHref}>
        {actionLabel}
      </Link>
    </div>
  );
}

export function DashboardView({ summary }: DashboardViewProps) {
  const totalWorkItems = summary.charts.workItemsByStatus.reduce(
    (total, bucket) => total + bucket.count,
    0,
  );
  const maxStatusCount = Math.max(
    1,
    ...summary.charts.workItemsByStatus.map((bucket) => bucket.count),
  );

  const metricCards = [
    {
      detail: "Non-archived customers marked active.",
      label: "Active customers",
      tone: "teal" as const,
      value: summary.metrics.activeCustomers,
      featured: true,
    },
    {
      detail: "Draft, active, or blocked work items.",
      label: "Open orders",
      tone: "info" as const,
      value: summary.metrics.openOrders,
    },
    {
      detail: "Active or blocked work due before today.",
      label: "Overdue orders",
      tone: "warning" as const,
      value: summary.metrics.overdueOrders,
    },
    {
      detail: "Urgent or high-priority unresolved issues.",
      label: "High-priority issues",
      tone: "danger" as const,
      value: summary.metrics.highPriorityIssues,
    },
    {
      detail: "Tracked inventory at or below threshold.",
      label: "Low-stock inventory",
      tone: "danger" as const,
      value: summary.metrics.lowStockInventory,
    },
    {
      detail: `${formatCount(
        summary.metrics.completedWorkItemsThisWeek,
      )} work items, ${formatCount(
        summary.metrics.resolvedIssuesThisWeek,
      )} issues.`,
      label: "Completed this week",
      tone: "success" as const,
      value: summary.metrics.completedWorkThisWeek,
    },
  ];

  return (
    <section className="op-command-center space-y-7">
      <div className="op-command-hero rounded-3xl p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="op-header-eyebrow">Operations overview</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Command center</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d4e4]">
            A live view of active work, operational risk, and the next actions that need a decision.
          </p>
        </div>
        <Link className="op-command-hero-action" href="/orders?dueDateBucket=OVERDUE">
          Review overdue work
        </Link>
      </div>

      <div className="op-command-metrics op-section-enter grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="op-surface rounded-lg">
          <div className="flex flex-col gap-2 border-b border-[#d9e1ea] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Work status</h3>
              <p className="mt-1 text-xs text-[#64748b]">
                {formatCount(totalWorkItems)} non-archived work items
              </p>
            </div>
            <StatusBadge tone={summary.metrics.overdueOrders > 0 ? "danger" : "success"}>
              {summary.metrics.overdueOrders > 0
                ? `${formatCount(summary.metrics.overdueOrders)} overdue`
                : "No overdue work"}
            </StatusBadge>
          </div>
          <div
            aria-label="Work items by status"
            className="space-y-4 px-4 py-5"
          >
            {totalWorkItems > 0 ? (
              summary.charts.workItemsByStatus.map((bucket) => {
                const meta = orderStatusMeta(bucket.status);
                const percentage = Math.round(
                  (bucket.count / maxStatusCount) * 100,
                );

                return (
                  <div
                    aria-label={`${meta.label} work items: ${formatCount(
                      bucket.count,
                    )}`}
                    key={bucket.status}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge value={bucket.status} />
                        <span className="text-sm font-medium text-[#334155]">
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#18212f]">
                        {formatCount(bucket.count)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e2e8f0]">
                      <div
                        className={`op-chart-bar h-full rounded-full ${statusBarClasses[bucket.status]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                description="Create orders or campaigns to populate work status reporting."
                title="No work status data"
              />
            )}
          </div>
        </div>

        <div className="op-urgent-panel op-surface rounded-lg">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Weekly completion</h3>
            <p className="mt-1 text-xs text-[#64748b]">
              {formatOrderDate(summary.dateRange.completedWeekStart)} to{" "}
              {formatOrderDate(summary.dateRange.completedWeekEnd)}
            </p>
          </div>
          <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 xl:grid-cols-1">
            <div className="op-surface-muted rounded-lg px-4 py-3">
              <div className="text-xs font-medium uppercase text-[#64748b]">
                Completed work items
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#15803d]">
                {formatCount(summary.metrics.completedWorkItemsThisWeek)}
              </div>
            </div>
            <div className="op-surface-muted rounded-lg px-4 py-3">
              <div className="text-xs font-medium uppercase text-[#64748b]">
                Resolved or closed issues
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#0f766e]">
                {formatCount(summary.metrics.resolvedIssuesThisWeek)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="op-urgent-panel op-surface rounded-lg">
          <PanelHeader
            actionHref="/orders?dueDateBucket=OVERDUE"
            actionLabel="View orders"
            count={summary.metrics.overdueOrders}
            title="Overdue orders"
          />
          <div className="divide-y divide-[#e2e8f0]">
            {summary.urgent.overdueOrders.length > 0 ? (
              summary.urgent.overdueOrders.map((order) => (
                <div className="px-4 py-3" key={order.id}>
                  <Link
                    className="op-text-link"
                    href={order.href}
                  >
                    {order.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <OrderStatusBadge value={order.status} />
                    <OrderPriorityBadge value={order.priority} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#64748b]">
                    {order.customerName}{" - "}
                    {order.ownerName}{" - "}Due{" "}
                    {formatOrderDate(order.dueDate)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                description="No active or blocked work is past due."
                title="No overdue orders"
              />
            )}
          </div>
        </div>

        <div className="op-urgent-panel op-surface rounded-lg">
          <PanelHeader
            actionHref="/issues?resolutionState=UNRESOLVED"
            actionLabel="View issues"
            count={summary.metrics.highPriorityIssues}
            title="High-priority issues"
          />
          <div className="divide-y divide-[#e2e8f0]">
            {summary.urgent.highPriorityIssues.length > 0 ? (
              summary.urgent.highPriorityIssues.map((issue) => (
                <div className="bg-[#fff7ed] px-4 py-3" key={issue.id}>
                  <Link
                    className="op-text-link"
                    href={issue.href}
                  >
                    {issue.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <IssueAttentionBadge
                      priority={issue.priority}
                      status={issue.status}
                    />
                    <IssueStatusBadge value={issue.status} />
                    <IssuePriorityBadge value={issue.priority} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#64748b]">
                    {issue.customerName}{" - "}
                    {issue.ownerName}{" - "}Updated{" "}
                    {formatIssueDate(issue.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">
                    {issue.workItemTitle}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                description="No urgent or high-priority unresolved issues need review."
                title="No high-priority issues"
              />
            )}
          </div>
        </div>

        <div className="op-surface rounded-lg">
          <PanelHeader
            actionHref="/inventory?lowStockState=LOW_STOCK"
            actionLabel="View inventory"
            count={summary.metrics.lowStockInventory}
            title="Low-stock inventory"
          />
          <div className="divide-y divide-[#e2e8f0]">
            {summary.urgent.lowStockInventory.length > 0 ? (
              summary.urgent.lowStockInventory.map((item) => (
                <div className="px-4 py-3" key={item.id}>
                  <Link
                    className="op-text-link"
                    href={item.href}
                  >
                    {item.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <InventoryStatusBadge value={item.status} />
                    {item.status !== InventoryStatus.LOW_STOCK ? (
                      <StatusBadge tone="danger">Low stock</StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#64748b]">
                    {formatInventoryCount(item.quantity)} on hand{" - "}
                    Threshold {formatInventoryCount(item.lowStockThreshold)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">
                    {item.customerName}{" - "}
                    {item.location}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                description="No tracked inventory is currently at or below threshold."
                title="No low-stock inventory"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
