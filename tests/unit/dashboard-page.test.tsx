import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardView } from "../../src/features/dashboard/dashboard-view";
import type { DashboardSummary } from "../../src/features/dashboard/dashboard-data";
import { WorkItemStatus } from "../../src/generated/prisma/client";

const emptyDashboardSummary: DashboardSummary = {
  charts: {
    workItemsByStatus: [
      { count: 0, status: WorkItemStatus.DRAFT },
      { count: 0, status: WorkItemStatus.ACTIVE },
      { count: 0, status: WorkItemStatus.BLOCKED },
      { count: 0, status: WorkItemStatus.COMPLETED },
      { count: 0, status: WorkItemStatus.CANCELLED },
    ],
  },
  dateRange: {
    completedWeekEnd: new Date("2026-07-13T00:00:00.000Z"),
    completedWeekStart: new Date("2026-07-06T00:00:00.000Z"),
    referenceDayStart: new Date("2026-07-09T00:00:00.000Z"),
  },
  metrics: {
    activeCustomers: 0,
    completedWorkItemsThisWeek: 0,
    completedWorkThisWeek: 0,
    highPriorityIssues: 0,
    lowStockInventory: 0,
    openOrders: 0,
    overdueOrders: 0,
    resolvedIssuesThisWeek: 0,
  },
  urgent: {
    highPriorityIssues: [],
    lowStockInventory: [],
    overdueOrders: [],
  },
};

describe("DashboardView", () => {
  it("renders empty dashboard branches without looking broken", () => {
    render(<DashboardView summary={emptyDashboardSummary} />);

    expect(
      screen.getByRole("group", { name: "Active customers: 0" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Open orders: 0" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Completed this week: 0" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No work status data")).toBeInTheDocument();
    expect(screen.getByText("No overdue orders")).toBeInTheDocument();
    expect(screen.getByText("No high-priority issues")).toBeInTheDocument();
    expect(screen.getByText("No low-stock inventory")).toBeInTheDocument();
    expect(screen.getByText("No overdue work")).toBeInTheDocument();
  });
});
