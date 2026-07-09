import { StatusBadge } from "@/components/ui/status-badge";

import {
  inventoryCategoryMeta,
  inventoryStatusMeta,
} from "./inventory-ui";

type BadgeTone = React.ComponentProps<typeof StatusBadge>["tone"];

type InventoryBadgeProps = {
  value: string;
};

export function InventoryCategoryBadge({ value }: InventoryBadgeProps) {
  const meta = inventoryCategoryMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function InventoryStatusBadge({ value }: InventoryBadgeProps) {
  const meta = inventoryStatusMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function InventoryLowStockBadge({ isLowStock }: { isLowStock: boolean }) {
  return isLowStock ? (
    <StatusBadge tone="danger">Low stock</StatusBadge>
  ) : (
    <StatusBadge tone="success">Stock ok</StatusBadge>
  );
}
