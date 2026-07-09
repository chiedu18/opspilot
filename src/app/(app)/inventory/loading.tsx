import { LoadingState } from "@/components/ui/loading-state";

export default function InventoryLoading() {
  return (
    <LoadingState
      description="Loading inventory records, filters, assignments, and stock state."
      title="Loading inventory"
    />
  );
}
