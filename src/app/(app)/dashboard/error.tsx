"use client";

import { ErrorState } from "@/components/ui/error-state";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <ErrorState
      description="Dashboard metrics could not be loaded from the demo database."
      onRetry={reset}
      title="Dashboard unavailable"
    />
  );
}
