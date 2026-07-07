"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      description="This protected demo view failed to render. The session remains available, so retrying the view is safe."
      onRetry={reset}
      title="OpsPilot view unavailable"
    />
  );
}
