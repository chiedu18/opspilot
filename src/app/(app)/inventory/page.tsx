import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArchiveInventoryButton } from "@/features/inventory/archive-inventory-button";
import {
  InventoryCategoryBadge,
  InventoryLowStockBadge,
  InventoryStatusBadge,
} from "@/features/inventory/inventory-badges";
import {
  getInventoryListPageData,
  parseInventoryListFilters,
  readInventorySearchParam,
  type InventorySearchParams,
} from "@/features/inventory/inventory-page-data";
import {
  formatInventoryCount,
  formatInventoryDate,
  inventoryArchiveFilterOptions,
  inventoryCategoryOptions,
  inventoryLowStockFilterOptions,
  inventoryStatusOptions,
} from "@/features/inventory/inventory-ui";

type InventoryPageProps = {
  searchParams?: Promise<InventorySearchParams>;
};

const inputClass =
  "h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]";

const actionLinkClass =
  "op-button op-button-secondary px-3";

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseInventoryListFilters(params);
  const archiveSuccess = readInventorySearchParam(params.archived) === "1";

  if (!filters.success) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Inventory</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
            Inventory filters could not be applied.
          </p>
        </div>
        <ErrorState
          description="Reset the inventory filters and try loading the list again."
          title="Inventory list unavailable"
        />
        <Link className={actionLinkClass} href="/inventory">
          Reset filters
        </Link>
      </section>
    );
  }

  const { customers, hasFilters, inventoryItems, metrics, owners, workItems } =
    await getInventoryListPageData(filters.data);
  const emptyTitle =
    metrics.tracked === 0 && !hasFilters
      ? "No inventory records yet"
      : "No matching inventory";
  const emptyDescription =
    metrics.tracked === 0 && !hasFilters
      ? "Create the first tracked asset, SKU, license, or equipment record."
      : "Try a different search term, category, status, customer, order, owner, low-stock, or archive filter.";

  return (
    <section className="op-list-page space-y-7">
      <div className="op-list-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inventory</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Fictional demo assets, SKUs, licenses, equipment, test accounts,
            ownership, assignments, and low-stock risk.
          </p>
        </div>
        <Link
          className="op-button op-button-primary px-4"
          href="/inventory/new"
          prefetch={false}
        >
          New inventory item
        </Link>
      </div>

      {archiveSuccess ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          Inventory item archived and removed from the default list.
        </div>
      ) : null}

      <div className="op-list-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="op-static-card rounded-lg px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Tracked
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatInventoryCount(metrics.tracked)}
          </div>
        </div>
        <div className="op-static-card rounded-lg px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Low stock
          </div>
          <div className="mt-1 text-lg font-semibold text-[#b91c1c]">
            {formatInventoryCount(metrics.lowStock)}
          </div>
        </div>
        <div className="op-static-card rounded-lg px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Assigned/reserved
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatInventoryCount(metrics.assignedOrReserved)}
          </div>
        </div>
        <div className="op-static-card rounded-lg px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Archived
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatInventoryCount(metrics.archived)}
          </div>
        </div>
      </div>

      <div className="op-list-surface overflow-hidden rounded-2xl border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(150px,1fr))] 2xl:grid-cols-[minmax(220px,1.3fr)_repeat(7,minmax(140px,1fr))_auto_auto] 2xl:items-end"
            key={[
              filters.data.q ?? "",
              filters.data.category ?? "",
              filters.data.status ?? "",
              filters.data.customerId ?? "",
              filters.data.workItemId ?? "",
              filters.data.ownerId ?? "",
              filters.data.lowStockState ?? "",
              filters.data.archiveState ?? "",
            ].join(":")}
          >
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="q"
              >
                Search
              </label>
              <input
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.q ?? ""}
                id="q"
                name="q"
                placeholder="Name, code, location, customer, order, or owner"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="category"
              >
                Category
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.category ?? ""}
                id="category"
                name="category"
              >
                <option value="">All categories</option>
                {inventoryCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="status"
              >
                Status
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.status ?? ""}
                id="status"
                name="status"
              >
                <option value="">All statuses</option>
                {inventoryStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="customerId"
              >
                Customer
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.customerId ?? ""}
                id="customerId"
                name="customerId"
              >
                <option value="">All customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="workItemId"
              >
                Related order
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.workItemId ?? ""}
                id="workItemId"
                name="workItemId"
              >
                <option value="">All orders</option>
                {workItems.map((workItem) => (
                  <option key={workItem.id} value={workItem.id}>
                    {workItem.title} - {workItem.customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="ownerId"
              >
                Owner
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.ownerId ?? ""}
                id="ownerId"
                name="ownerId"
              >
                <option value="">All owners</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="lowStockState"
              >
                Low stock
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.lowStockState ?? ""}
                id="lowStockState"
                name="lowStockState"
              >
                {inventoryLowStockFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="archiveState"
              >
                Archive visibility
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.archiveState ?? "WITHOUT"}
                id="archiveState"
                name="archiveState"
              >
                {inventoryArchiveFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="op-button op-button-primary h-10 px-4"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="op-button op-button-secondary h-10 px-4"
              href="/inventory"
            >
              Reset
            </Link>
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Inventory and asset records</h3>
          <p className="text-sm text-[#64748b]">
            {inventoryItems.length} shown
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1480px] border-collapse text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Threshold</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Location/code</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Related</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {inventoryItems.length > 0 ? (
                inventoryItems.map((item) => {
                  const isArchived = Boolean(item.archivedAt);

                  return (
                    <tr key={item.id} className="op-table-row align-top">
                      <td className="px-4 py-3">
                        <Link
                          className="op-text-link"
                          href={`/inventory/${item.id}`}
                        >
                          {item.name}
                        </Link>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {item.referenceCode ?? "No reference code"}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-[#64748b]">
                          {item.notes ? item.notes.slice(0, 110) : "No notes"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <InventoryCategoryBadge value={item.category} />
                      </td>
                      <td className="px-4 py-3" data-mobile-label="Status">
                        <div className="flex flex-wrap gap-2">
                          <InventoryStatusBadge value={item.status} />
                          {isArchived ? (
                            <span className="rounded-md border border-[#d9e1ea] bg-[#f8fafc] px-2 py-1 text-xs font-semibold leading-none text-[#64748b]">
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 font-medium text-[#334155]"
                        data-mobile-label="Quantity"
                      >
                        {formatInventoryCount(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {formatInventoryCount(item.lowStockThreshold)}
                      </td>
                      <td className="px-4 py-3">
                        <InventoryLowStockBadge isLowStock={item.isLowStock} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {item.location ?? "No location"}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {item.referenceCode ?? "No code"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {item.owner?.name ?? "Unassigned"}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {item.owner?.email ?? "No owner email"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {item.customer ? (
                            <Link
                              className="op-text-link"
                              href={`/customers/${item.customer.id}`}
                            >
                              {item.customer.name}
                            </Link>
                          ) : (
                            "No customer"
                          )}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {item.workItem ? (
                            <Link
                              className="op-text-link"
                              href={`/orders/${item.workItem.id}`}
                            >
                              {item.workItem.title}
                            </Link>
                          ) : (
                            "No related order"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {formatInventoryDate(item.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="op-row-actions flex flex-wrap gap-2">
                          <Link
                            aria-label={`View ${item.name}`}
                            className={actionLinkClass}
                            href={`/inventory/${item.id}`}
                          >
                            View
                          </Link>
                          {!isArchived ? (
                            <>
                              <Link
                                aria-label={`Edit ${item.name}`}
                                className={actionLinkClass}
                                href={`/inventory/${item.id}/edit`}
                              >
                                Edit
                              </Link>
                              <ArchiveInventoryButton
                                inventoryId={item.id}
                                inventoryName={item.name}
                              />
                            </>
                          ) : (
                            <span className="rounded-lg border border-[#d9e1ea] px-3 py-2 text-sm font-semibold text-[#64748b]">
                              Read only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-4" colSpan={11}>
                    <EmptyState
                      actionHref={hasFilters ? "/inventory" : "/inventory/new"}
                      actionLabel={hasFilters ? "Reset filters" : "Create inventory item"}
                      description={emptyDescription}
                      title={emptyTitle}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
