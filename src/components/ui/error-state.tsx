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
      aria-live="assertive"
      className="op-error-surface op-section-enter rounded-lg border border-[#fecaca] bg-white p-5 text-[#18212f] shadow-[var(--shadow-surface)]"
      role="alert"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-[#b91c1c]">Error state</p>
        <h2 className="mt-1 text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748b]">{description}</p>
      </div>
      {onRetry ? (
        <button
          className="op-button op-button-secondary mt-4 px-3"
          onClick={onRetry}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
