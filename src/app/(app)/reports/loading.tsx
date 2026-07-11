import { LoadingState } from "@/components/ui/loading-state";

export default function ReportsLoading() {
  return (
    <LoadingState
      description="Loading report filters, preview rows, and export metadata."
      title="Loading reports"
      variant="reports"
    />
  );
}
