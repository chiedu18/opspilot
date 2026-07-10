type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Workspace view unavailable",
  description = "The current view could not be loaded. Try again, or return to another section.",
  actionLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="op-section-enter rounded-lg border border-[#fecaca] bg-white p-5 text-[#18212f] shadow-[var(--shadow-surface)]"
      role="alert"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-[#b91c1c]">Error state</p>
        <h2 className="mt-1 text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748b]">{description}</p>
      </div>
      {onRetry ? (
        <button
          className="op-focus-ring op-pressable mt-4 rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
          onClick={onRetry}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
