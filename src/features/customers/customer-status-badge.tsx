import { StatusBadge } from "@/components/ui/status-badge";

import { customerStatusMeta } from "./customer-ui";

type CustomerStatusBadgeProps = {
  status: string;
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const meta = customerStatusMeta(status);

  return (
    <StatusBadge tone={meta.tone} className="whitespace-nowrap">
      {meta.label}
    </StatusBadge>
  );
}
