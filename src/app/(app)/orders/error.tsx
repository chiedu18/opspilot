"use client";

import { ErrorState } from "@/components/ui/error-state";

type OrdersErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OrdersError({ reset }: OrdersErrorProps) {
  return (
    <ErrorState
      description="Order records could not be loaded from the demo database."
      onRetry={reset}
      title="Orders unavailable"
    />
  );
}
