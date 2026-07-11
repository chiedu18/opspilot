import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  eyebrow,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="op-empty-state op-section-enter mx-auto grid max-w-lg place-items-center gap-2 px-4 py-8 text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase text-[#64748b]">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-sm font-semibold text-[#18212f]">{title}</h3>
      <p className="text-sm leading-6 text-[#64748b]">{description}</p>
      {actionHref && actionLabel ? (
        <Link className="op-button op-button-secondary mt-2 px-3" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
