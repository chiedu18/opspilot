type EmptyStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function EmptyState({ title, description, eyebrow }: EmptyStateProps) {
  return (
    <div className="mx-auto grid max-w-lg place-items-center gap-2 px-4 py-8 text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase text-[#64748b]">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-sm font-semibold text-[#18212f]">{title}</h3>
      <p className="text-sm leading-6 text-[#64748b]">{description}</p>
    </div>
  );
}
