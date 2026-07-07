import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModulePage } from "../../src/app/(app)/_components/module-page";

describe("ModulePage", () => {
  it("renders an honest empty scaffold table", () => {
    render(
      <ModulePage
        title="Customers"
        description="Accounts, contacts, ownership, and account status."
        columns={["Customer", "Contact", "Status"]}
        primaryMetric="0"
        secondaryMetric="0"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Customers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Accounts, contacts, ownership, and account status."),
    ).toBeInTheDocument();
    expect(screen.getByText("No records loaded")).toBeInTheDocument();
    expect(screen.getByText("Scaffolded")).toBeInTheDocument();
    expect(screen.getByLabelText("Search records")).toBeDisabled();
    expect(screen.getByLabelText("Filter status")).toBeDisabled();
    expect(screen.getByRole("columnheader", { name: "Customer" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Contact" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeVisible();
  });
});
