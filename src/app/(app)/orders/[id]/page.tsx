import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { ArchiveOrderButton } from "@/features/orders/archive-order-button";
import {
  OrderKindBadge,
  OrderOverdueBadge,
  OrderPriorityBadge,
  OrderStatusBadge,
} from "@/features/orders/order-badges";
import {
  getOrderDetail,
  readOrderSearchParam,
  type OrderSearchParams,
} from "@/features/orders/order-page-data";
import {
  formatOrderCurrency,
  formatOrderDate,
  formatOrderDateTime,
} from "@/features/orders/order-ui";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<OrderSearchParams>;
};

const actionLinkClass =
  "rounded-lg border border-[#cbd5e1] px-4 py-2 text-center text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]";

export default async function OrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  const wasCreated = readOrderSearchParam(query.created) === "1";
  const wasSaved = readOrderSearchParam(query.saved) === "1";
  const isArchived = Boolean(order.archivedAt);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Order record</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{order.title}</h2>
            <OrderKindBadge value={order.kind} />
            <OrderStatusBadge value={order.status} />
            <OrderPriorityBadge value={order.priority} />
            {order.isOverdue ? <OrderOverdueBadge /> : null}
            {isArchived ? <StatusBadge tone="neutral">Archived</StatusBadge> : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Work item for {order.customer.name} owned by{" "}
            {order.owner?.name ?? "an unassigned team member"}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className={actionLinkClass} href="/orders">
            Back to orders
          </Link>
          {!isArchived ? (
            <>
              <Link className={actionLinkClass} href={`/orders/${order.id}/edit`}>
                Edit
              </Link>
              <ArchiveOrderButton orderId={order.id} orderTitle={order.title} />
            </>
          ) : null}
        </div>
      </div>

      {wasCreated || wasSaved ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          Order {wasCreated ? "created" : "updated"} successfully.
        </div>
      ) : null}

      {isArchived ? (
        <div className="rounded-lg border border-[#d9e1ea] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
          Archived orders are retained as read-only records for related work and
          reporting.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Work details</h3>
          </div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Customer
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                <Link
                  className="text-[#0f766e] hover:text-[#115e59]"
                  href={`/customers/${order.customer.id}`}
                >
                  {order.customer.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Owner
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {order.owner?.name ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Due date
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#334155]">
                {formatOrderDate(order.dueDate)}
                {order.isOverdue ? <OrderOverdueBadge /> : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Estimated value
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatOrderCurrency(order.estimatedValueCents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Related issues
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {order.counts.issues}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Related assets
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {order.counts.inventoryItems}
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
                {formatOrderDateTime(order.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Updated
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatOrderDateTime(order.updatedAt)}
              </dd>
            </div>
            {order.completedAt ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-[#64748b]">
                  Completed
                </dt>
                <dd className="mt-1 text-sm text-[#334155]">
                  {formatOrderDateTime(order.completedAt)}
                </dd>
              </div>
            ) : null}
            {order.archivedAt ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-[#64748b]">
                  Archived
                </dt>
                <dd className="mt-1 text-sm text-[#334155]">
                  {formatOrderDateTime(order.archivedAt)}
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
          {order.notes ?? "No notes recorded."}
        </div>
      </div>
    </section>
  );
}
