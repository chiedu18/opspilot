import { ModulePage } from "../_components/module-page";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reports"
      description="Filtered operational views prepared for review and export."
      columns={["Report", "Type", "Rows", "Updated", "Export"]}
      primaryMetric="0"
      secondaryMetric="0"
    />
  );
}
