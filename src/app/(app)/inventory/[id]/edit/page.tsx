import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { InventoryForm } from "@/features/inventory/inventory-form";
import { getInventoryEditPageData } from "@/features/inventory/inventory-page-data";
import type { InventoryFormValues } from "@/features/inventory/inventory-ui";

type EditInventoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const actionLinkClass =
  "op-button op-button-secondary px-4";

export default async function EditInventoryPage({
  params,
}: EditInventoryPageProps) {
  const { id } = await params;
  const data = await getInventoryEditPageData(id);

  if (!data) {
    notFound();
  }

  const { customers, inventoryItem, owners, workItems } = data;
  const isArchived = Boolean(inventoryItem.archivedAt);

  if (isArchived) {
    return (
      <section className="op-form-page space-y-7">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Inventory</p>
          <h2 className="mt-1 text-xl font-semibold">
            Edit {inventoryItem.name}
          </h2>
        </div>
        <ErrorState
          description="Archived inventory items are retained as read-only records in this workflow."
          title="Inventory item is archived"
        />
        <Link className={actionLinkClass} href={`/inventory/${inventoryItem.id}`}>
          Back to inventory item
        </Link>
      </section>
    );
  }

  return (
    <section className="op-form-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Inventory</p>
          <h2 className="mt-1 text-xl font-semibold">
            Edit {inventoryItem.name}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Update quantity, threshold, status, ownership, assignment, location,
            reference code, and notes for this fictional demo asset.
          </p>
        </div>
        <Link className={actionLinkClass} href={`/inventory/${inventoryItem.id}`}>
          Back to inventory item
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Inventory details</h3>
        </div>
        <div className="p-4">
          <InventoryForm
            action={`/api/inventory/${inventoryItem.id}`}
            cancelHref={`/inventory/${inventoryItem.id}`}
            customers={customers}
            initialValues={{
              category:
                inventoryItem.category as InventoryFormValues["category"],
              customerId: inventoryItem.customerId ?? "",
              location: inventoryItem.location ?? "",
              lowStockThreshold: String(inventoryItem.lowStockThreshold),
              name: inventoryItem.name,
              notes: inventoryItem.notes ?? "",
              ownerId: inventoryItem.ownerId ?? "",
              quantity: String(inventoryItem.quantity),
              referenceCode: inventoryItem.referenceCode ?? "",
              status: inventoryItem.status as InventoryFormValues["status"],
              workItemId: inventoryItem.workItemId ?? "",
            }}
            method="PATCH"
            mode="edit"
            owners={owners}
            workItems={workItems}
          />
        </div>
      </div>
    </section>
  );
}
