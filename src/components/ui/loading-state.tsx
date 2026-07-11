type LoadingStateProps = {
  title?: string;
  description?: string;
  variant?: "dashboard" | "list" | "reports";
};

export function LoadingState({
  title = "Loading workspace",
  description = "Preparing the current operations view.",
  variant = "list",
}: LoadingStateProps) {
  const isDashboard = variant === "dashboard";
  const isReports = variant === "reports";

  return (
    <div
      aria-live="polite"
      className="op-state-surface op-surface op-section-enter rounded-lg p-5"
      role="status"
    >
      <div className="max-w-xl">
        <h2 className="text-base font-semibold text-[#18212f]">{title}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{description}</p>
      </div>
      {isDashboard ? (
        <div className="mt-5 space-y-5" aria-hidden="true">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, item) => (
              <div className="op-skeleton h-28 rounded-lg" key={item} />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="op-skeleton h-72 rounded-lg" />
            <div className="op-skeleton h-72 rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3" aria-hidden="true">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: isReports ? 3 : 2 }, (_, item) => (
              <div className="op-skeleton h-20 rounded-lg" key={item} />
            ))}
          </div>
          <div className="op-skeleton h-12 rounded-lg" />
          <div className="space-y-2 rounded-lg border border-[#e2e8f0] p-4">
            {Array.from({ length: 5 }, (_, item) => (
              <div className="op-skeleton h-10 rounded-md" key={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
