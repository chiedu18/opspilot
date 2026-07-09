import { LoadingState } from "@/components/ui/loading-state";

export default function IssuesLoading() {
  return (
    <LoadingState
      description="Loading issues, filters, ownership, related work, and resolution state."
      title="Loading issues"
    />
  );
}
