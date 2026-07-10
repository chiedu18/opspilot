"use client";

import { ErrorState } from "@/components/ui/error-state";

type ReportsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReportsError({ reset }: ReportsErrorProps) {
  return (
    <ErrorState
      description="Report data could not be loaded from the demo database."
      onRetry={reset}
      title="Reports unavailable"
    />
  );
}
