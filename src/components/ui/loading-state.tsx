type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "Loading workspace",
  description = "Preparing the current operations view.",
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-[#d9e1ea] bg-white p-5"
      role="status"
    >
      <div className="max-w-xl">
        <h2 className="text-base font-semibold text-[#18212f]">{title}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{description}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            aria-hidden="true"
            className="h-20 animate-pulse rounded-lg border border-[#e2e8f0] bg-[#f8fafc]"
            key={item}
          />
        ))}
      </div>
    </div>
  );
}
