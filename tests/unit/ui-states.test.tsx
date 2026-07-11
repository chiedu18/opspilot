import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "../../src/components/ui/empty-state";
import { ErrorState } from "../../src/components/ui/error-state";
import { LoadingState } from "../../src/components/ui/loading-state";
import { StatusBadge } from "../../src/components/ui/status-badge";
import { ThemeToggle } from "../../src/components/ui/theme-toggle";

describe("shared UI states", () => {
  it("renders an empty state with clear status text", () => {
    render(
      <EmptyState
        description="No matching records are available for this view."
        eyebrow="Empty"
        title="No records loaded"
      />,
    );

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("No records loaded")).toBeInTheDocument();
    expect(
      screen.getByText("No matching records are available for this view."),
    ).toBeInTheDocument();
  });

  it("renders a loading state as polite status output", () => {
    render(<LoadingState title="Loading customers" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading customers");
  });

  it("renders an error state with retry behavior", async () => {
    const retry = vi.fn();

    render(<ErrorState onRetry={retry} title="View unavailable" />);
    screen.getByRole("button", { name: "Try again" }).click();

    expect(screen.getByRole("alert")).toHaveTextContent("View unavailable");
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("renders a reusable status badge", () => {
    render(<StatusBadge tone="demo">Demo workspace</StatusBadge>);

    expect(screen.getByText("Demo workspace")).toBeInTheDocument();
  });

  it("reads, switches, and persists the document theme", () => {
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("opspilot-theme", "dark");

    render(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Switch to light mode" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("opspilot-theme")).toBe("light");
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("opspilot-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
