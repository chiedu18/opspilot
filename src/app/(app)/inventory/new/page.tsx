import Link from "next/link";

import { InventoryForm } from "@/features/inventory/inventory-form";
import { getInventoryCreatePageData } from "@/features/inventory/inventory-page-data";

export default async function NewInventoryPage() {
  const { customers, owners, workItems } = await getInventoryCreatePageData();

  return (
    <section className="op-form-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Inventory</p>
          <h2 className="mt-1 text-xl font-semibold">New inventory item</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Add a fictional demo asset, SKU, license, equipment item, test
            account, or software asset with quantity and assignment context.
          </p>
        </div>
        <Link
          className="op-button op-button-secondary px-4"
          href="/inventory"
        >
          Back to inventory
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Inventory details</h3>
        </div>
        <div className="p-4">
          <InventoryForm
            action="/api/inventory"
            cancelHref="/inventory"
            customers={customers}
            initialValues={{
              category: "DEVICE",
              customerId: "",
              location: "",
              lowStockThreshold: "0",
              name: "",
              notes: "",
              ownerId: "team-ava-morgan",
              quantity: "1",
              referenceCode: "",
              status: "AVAILABLE",
              workItemId: "",
            }}
            method="POST"
            mode="create"
            owners={owners}
            workItems={workItems}
          />
        </div>
      </div>
    </section>
  );
}
