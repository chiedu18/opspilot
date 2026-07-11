"use client";

import { useEffect, useRef, useState } from "react";

type ExportReportLinkProps = {
  href: string;
  label: string;
};

export function ExportReportLink({ href, label }: ExportReportLinkProps) {
  const [exportState, setExportState] = useState<"complete" | "idle" | "preparing">(
    "idle",
  );
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const beginExport = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setExportState("preparing");
    timers.current = [
      window.setTimeout(() => setExportState("complete"), 650),
      window.setTimeout(() => setExportState("idle"), 3200),
    ];
  };

  const isPreparing = exportState === "preparing";

  return (
    <div className="op-export-control flex flex-col items-end gap-1" data-state={exportState}>
      <a
        aria-busy={isPreparing || undefined}
        className="op-button op-button-primary px-4"
        data-pending={isPreparing || undefined}
        href={href}
        onClick={beginExport}
      >
        {exportState === "preparing"
          ? "Preparing CSV..."
          : exportState === "complete"
            ? "Download started"
            : label}
      </a>
      <p aria-live="polite" className="min-h-4 text-right text-xs text-[#64748b]">
        {exportState === "preparing"
          ? "Building the filtered report."
          : exportState === "complete"
            ? "Your CSV is ready."
            : ""}
      </p>
    </div>
  );
}
