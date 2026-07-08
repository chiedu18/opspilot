import { LoadingState } from "@/components/ui/loading-state";

export default function CustomersLoading() {
  return (
    <LoadingState
      description="Loading customer records and filters."
      title="Loading customers"
    />
  );
}
