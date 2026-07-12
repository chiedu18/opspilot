"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetDemoButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const resetWorkspace = async () => {
    if (!window.confirm("Reset your private demo workspace to the original seed data?")) {
      return;
    }

    setIsPending(true);
    const response = await fetch("/api/session/reset", { method: "POST" });

    if (response.ok) {
      router.push("/dashboard?reset=1");
      router.refresh();
      return;
    }

    setIsPending(false);
  };

  return (
    <button
      className="op-button op-button-subtle px-3"
      data-pending={isPending || undefined}
      disabled={isPending}
      onClick={resetWorkspace}
      type="button"
    >
      {isPending ? "Resetting…" : "Reset demo"}
    </button>
  );
}
