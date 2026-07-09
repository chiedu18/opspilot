import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArchiveOrderButton } from "@/features/orders/archive-order-button";
import {
  OrderKindBadge,
  OrderOverdueBadge,
  OrderPriorityBadge,
  OrderStatusBadge,
} from "@/features/orders/order-badges";
import {
  getOrderListPageData,
  parseOrderListFilters,
  readOrderSearchParam,
  type OrderSearchParams,
} from "@/features/orders/order-page-data";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderArchiveFilterOptions,
  orderDueDateBucketOptions,
  orderKindOptions,
  orderPriorityOptions,
  orderStatusOptions,
} from "@/features/orders/order-ui";

type OrdersPageProps = {
  searchParams?: Promise<OrderSearchParams>;
};

const inputClass =
  "h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]";

const actionLinkClass =
  "rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]";

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseOrderListFilters(params);
  const archiveSuccess = readOrderSearchParam(params.archived) === "1";

  if (!filters.success) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
            Order filters could not be applied.
          </p>
        </div>
        <ErrorState
          description="Reset the order filters and try loading the list again."
          title="Order list unavailable"
        />
        <Link className={actionLinkClass} href="/orders">
          Reset filters
        </Link>
      </section>
    );
  }

  const { customers, metrics, orders, owners } = await getOrderListPageData(
    filters.data,
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Fictional demo work items for customer orders, campaigns, service
            requests, due dates, owners, and operational risk.
          </p>
        </div>
        <Link
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
          href="/orders/new"
          prefetch={false}
        >
          New order
        </Link>
      </div>

      {archiveSuccess ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          Order archived and removed from the default list.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Open
          </div>
          <div className="mt-1 text-lg font-semibold">{metrics.open}</div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Overdue
          </div>
          <div className="mt-1 text-lg font-semibold text-[#b91c1c]">
            {metrics.overdue}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Blocked
          </div>
          <div className="mt-1 text-lg font-semibold">{metrics.blocked}</div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Archived
          </div>
          <div className="mt-1 text-lg font-semibold">{metrics.archived}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(150px,1fr))] 2xl:grid-cols-[minmax(220px,1.3fr)_repeat(7,minmax(140px,1fr))_auto_auto] 2xl:items-end"
            key={[
              filters.data.q ?? "",
              filters.data.kind ?? "",
              filters.data.status ?? "",
              filters.data.priority ?? "",
              filters.data.customerId ?? "",
              filters.data.ownerId ?? "",
              filters.data.dueDateBucket ?? "",
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
                placeholder="Title, customer, owner, or notes"
              />
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
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="priority"
              >
                Priority
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.priority ?? ""}
                id="priority"
                name="priority"
              >
                <option value="">All priorities</option>
                {orderPriorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase text-[#64748b]"
                htmlFor="kind"
              >
                Kind
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.kind ?? ""}
                id="kind"
                name="kind"
              >
                <option value="">All kinds</option>
                {orderKindOptions.map((option) => (
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
                htmlFor="dueDateBucket"
              >
                Due date
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.dueDateBucket ?? ""}
                id="dueDateBucket"
                name="dueDateBucket"
              >
                {orderDueDateBucketOptions.map((option) => (
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
                {orderArchiveFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="h-10 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="flex h-10 items-center justify-center rounded-lg border border-[#cbd5e1] px-4 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
              href="/orders"
            >
              Reset
            </Link>
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Order and campaign records</h3>
          <p className="text-sm text-[#64748b]">{orders.length} shown</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
              <tr>
                <th className="px-4 py-3 font-semibold">Work item</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Related</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {orders.length > 0 ? (
                orders.map((order) => {
                  const isArchived = Boolean(order.archivedAt);

                  return (
                    <tr key={order.id} className="align-top">
                      <td className="px-4 py-3">
                        <Link
                          className="font-semibold text-[#0f766e] hover:text-[#115e59]"
                          href={`/orders/${order.id}`}
                        >
                          {order.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <OrderKindBadge value={order.kind} />
                          {isArchived ? (
                            <span className="rounded-md border border-[#d9e1ea] bg-[#f8fafc] px-2 py-1 text-xs font-semibold leading-none text-[#64748b]">
                              Archived
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-[#64748b]">
                          {order.notes ? order.notes.slice(0, 110) : "No notes"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {order.customer.name}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {order.customer.archivedAt ||
                          order.customer.status === "ARCHIVED"
                            ? "Archived customer"
                            : "Active customer"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {order.owner?.name ?? "Unassigned"}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {order.owner?.email ?? "No owner email"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {formatOrderDate(order.dueDate)}
                        </div>
                        <div className="mt-2">
                          {order.isOverdue ? (
                            <OrderOverdueBadge />
                          ) : (
                            <span className="text-xs text-[#64748b]">
                              On schedule
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {formatOrderCurrency(order.estimatedValueCents)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge value={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <OrderPriorityBadge value={order.priority} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[#475569]">
                        <div>{order.counts.issues} issues</div>
                        <div>{order.counts.inventoryItems} assets</div>
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {formatOrderDate(order.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            aria-label={`View ${order.title}`}
                            className={actionLinkClass}
                            href={`/orders/${order.id}`}
                          >
                            View
                          </Link>
                          {!isArchived ? (
                            <>
                              <Link
                                aria-label={`Edit ${order.title}`}
                                className={actionLinkClass}
                                href={`/orders/${order.id}/edit`}
                              >
                                Edit
                              </Link>
                              <ArchiveOrderButton
                                orderId={order.id}
                                orderTitle={order.title}
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
                  <td className="px-4 py-4" colSpan={10}>
                    <EmptyState
                      description="Try a different search term, status, owner, customer, due-date, or archive filter."
                      title="No matching orders"
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
