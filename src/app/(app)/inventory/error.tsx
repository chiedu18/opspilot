"use client";

import { ErrorState } from "@/components/ui/error-state";

type InventoryErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InventoryError({ reset }: InventoryErrorProps) {
  return (
    <ErrorState
      description="Inventory records could not be loaded from the demo database."
      onRetry={reset}
      title="Inventory unavailable"
    />
  );
}
