import { ModulePage } from "../_components/module-page";

export default function InventoryPage() {
  return (
    <ModulePage
      title="Inventory"
      description="Tracked assets, quantities, locations, and assignment status."
      columns={["Item", "Category", "Quantity", "Status", "Location"]}
      primaryMetric="0"
      secondaryMetric="0"
    />
  );
}
