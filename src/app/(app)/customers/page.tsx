import { ModulePage } from "../_components/module-page";

export default function CustomersPage() {
  return (
    <ModulePage
      title="Customers"
      description="Accounts, contacts, ownership, and account status."
      columns={["Customer", "Contact", "Status", "Owner", "Updated"]}
      primaryMetric="0"
      secondaryMetric="0"
    />
  );
}
