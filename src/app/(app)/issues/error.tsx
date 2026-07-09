"use client";

import { ErrorState } from "@/components/ui/error-state";

type IssuesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function IssuesError({ reset }: IssuesErrorProps) {
  return (
    <ErrorState
      description="Issues could not be loaded from the demo database."
      onRetry={reset}
      title="Issues unavailable"
    />
  );
}
