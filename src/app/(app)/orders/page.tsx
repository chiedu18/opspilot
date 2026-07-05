import { ModulePage } from "../_components/module-page";

export default function OrdersPage() {
  return (
    <ModulePage
      title="Orders"
      description="Customer work, campaign status, due dates, and estimated value."
      columns={["Order", "Customer", "Priority", "Status", "Due date"]}
      primaryMetric="0"
      secondaryMetric="0"
    />
  );
}
