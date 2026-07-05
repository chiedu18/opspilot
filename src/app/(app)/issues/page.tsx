import { ModulePage } from "../_components/module-page";

export default function IssuesPage() {
  return (
    <ModulePage
      title="Issues"
      description="Operational problems, blockers, priorities, and resolution work."
      columns={["Issue", "Priority", "Status", "Owner", "Related work"]}
      primaryMetric="0"
      secondaryMetric="0"
    />
  );
}
