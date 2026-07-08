"use client";

import { ErrorState } from "@/components/ui/error-state";

type CustomersErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CustomersError({ reset }: CustomersErrorProps) {
  return (
    <ErrorState
      description="Customer records could not be loaded from the demo database."
      onRetry={reset}
      title="Customers unavailable"
    />
  );
}
