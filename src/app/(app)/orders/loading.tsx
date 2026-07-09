import { LoadingState } from "@/components/ui/loading-state";

export default function OrdersLoading() {
  return (
    <LoadingState
      description="Loading order records, filters, and related ownership data."
      title="Loading orders"
    />
  );
}
