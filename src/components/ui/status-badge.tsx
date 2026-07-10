type StatusBadgeTone =
  | "neutral"
  | "demo"
  | "info"
  | "success"
  | "warning"
  | "danger";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: "border-[#d9e1ea] bg-[#f8fafc] text-[#475569]",
  demo: "border-[#99f6e4] bg-[#ecfdf5] text-[#0f766e]",
  info: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  success: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  warning: "border-[#fed7aa] bg-[#fff7ed] text-[#b45309]",
  danger: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`op-status-badge inline-flex min-h-6 items-center rounded-md border px-2 py-1 text-xs font-semibold leading-none ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
