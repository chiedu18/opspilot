import { StatusBadge } from "@/components/ui/status-badge";

import {
  orderKindMeta,
  orderPriorityMeta,
  orderStatusMeta,
} from "./order-ui";

type BadgeTone = React.ComponentProps<typeof StatusBadge>["tone"];

type OrderBadgeProps = {
  value: string;
};

export function OrderKindBadge({ value }: OrderBadgeProps) {
  const meta = orderKindMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function OrderStatusBadge({ value }: OrderBadgeProps) {
  const meta = orderStatusMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function OrderPriorityBadge({ value }: OrderBadgeProps) {
  const meta = orderPriorityMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function OrderOverdueBadge() {
  return <StatusBadge tone="danger">Overdue</StatusBadge>;
}
