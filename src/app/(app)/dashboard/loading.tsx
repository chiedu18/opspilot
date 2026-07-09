import { LoadingState } from "@/components/ui/loading-state";

export default function DashboardLoading() {
  return (
    <LoadingState
      description="Loading metrics, work status, and urgent operations queues."
      title="Loading dashboard"
    />
  );
}
