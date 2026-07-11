import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { ArchiveInventoryButton } from "@/features/inventory/archive-inventory-button";
import {
  InventoryCategoryBadge,
  InventoryLowStockBadge,
  InventoryStatusBadge,
} from "@/features/inventory/inventory-badges";
import {
  getInventoryDetail,
  readInventorySearchParam,
  type InventorySearchParams,
} from "@/features/inventory/inventory-page-data";
import {
  formatInventoryCount,
  formatInventoryDateTime,
} from "@/features/inventory/inventory-ui";

type InventoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<InventorySearchParams>;
};

const actionLinkClass =
  "op-button op-button-secondary px-4";

export default async function InventoryDetailPage({
  params,
  searchParams,
}: InventoryDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const item = await getInventoryDetail(id);

  if (!item) {
    notFound();
  }

  const wasCreated = readInventorySearchParam(query.created) === "1";
  const wasSaved = readInventorySearchParam(query.saved) === "1";
  const isArchived = Boolean(item.archivedAt);

  return (
    <section className="op-record-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">
            Inventory record
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <InventoryCategoryBadge value={item.category} />
            <InventoryStatusBadge value={item.status} />
            <InventoryLowStockBadge isLowStock={item.isLowStock} />
            {isArchived ? <StatusBadge tone="neutral">Archived</StatusBadge> : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            {item.referenceCode ?? "Uncoded inventory item"} owned by{" "}
            {item.owner?.name ?? "an unassigned team member"}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className={actionLinkClass} href="/inventory">
            Back to inventory
          </Link>
          {!isArchived ? (
            <>
              <Link
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
          ) : null}
        </div>
      </div>

      {wasCreated || wasSaved ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          Inventory item {wasCreated ? "created" : "updated"} successfully.
        </div>
      ) : null}

      {isArchived ? (
        <div className="rounded-lg border border-[#d9e1ea] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
          Archived inventory items are retained as read-only records for related
          work, issue history, and reporting.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Inventory details</h3>
          </div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Quantity
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {formatInventoryCount(item.quantity)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Low-stock threshold
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatInventoryCount(item.lowStockThreshold)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Stock state
              </dt>
              <dd className="mt-1">
                <InventoryLowStockBadge isLowStock={item.isLowStock} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Location
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {item.location ?? "No location recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Reference code
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {item.referenceCode ?? "No reference code"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Owner
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {item.owner?.name ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Customer
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
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
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Related order
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
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
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Activity events
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatInventoryCount(item.counts.activityEvents)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Record dates</h3>
          </div>
          <dl className="grid gap-4 p-4">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Created
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatInventoryDateTime(item.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Updated
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatInventoryDateTime(item.updatedAt)}
              </dd>
            </div>
            {item.archivedAt ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-[#64748b]">
                  Archived
                </dt>
                <dd className="mt-1 text-sm text-[#334155]">
                  {formatInventoryDateTime(item.archivedAt)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Notes</h3>
        </div>
        <div className="min-h-36 p-4 text-sm leading-6 text-[#334155]">
          {item.notes ?? "No notes recorded."}
        </div>
      </div>
    </section>
  );
}
