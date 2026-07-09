import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { OrderForm } from "@/features/orders/order-form";
import { getOrderEditPageData } from "@/features/orders/order-page-data";
import {
  formatOrderDateInput,
  formatOrderValueInput,
  type OrderFormValues,
} from "@/features/orders/order-ui";

type EditOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const actionLinkClass =
  "rounded-lg border border-[#cbd5e1] px-4 py-2 text-center text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]";

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const data = await getOrderEditPageData(id);

  if (!data) {
    notFound();
  }

  const { customers, order, owners } = data;
  const isArchived = Boolean(order.archivedAt);

  if (isArchived) {
    return (
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Orders</p>
          <h2 className="mt-1 text-xl font-semibold">Edit {order.title}</h2>
        </div>
        <ErrorState
          description="Archived orders are retained as read-only records in this workflow."
          title="Order is archived"
        />
        <Link className={actionLinkClass} href={`/orders/${order.id}`}>
          Back to order
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Orders</p>
          <h2 className="mt-1 text-xl font-semibold">Edit {order.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Update workflow ownership, timing, priority, status, value, and
            notes for this fictional demo work item.
          </p>
        </div>
        <Link className={actionLinkClass} href={`/orders/${order.id}`}>
          Back to order
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Order details</h3>
        </div>
        <div className="p-4">
          <OrderForm
            action={`/api/orders/${order.id}`}
            cancelHref={`/orders/${order.id}`}
            customers={customers}
            initialValues={{
              customerId: order.customerId,
              dueDate: formatOrderDateInput(order.dueDate),
              estimatedValueCents: formatOrderValueInput(
                order.estimatedValueCents,
              ),
              kind: order.kind as OrderFormValues["kind"],
              notes: order.notes ?? "",
              ownerId: order.ownerId ?? "",
              priority: order.priority as OrderFormValues["priority"],
              status: order.status as OrderFormValues["status"],
              title: order.title,
            }}
            method="PATCH"
            mode="edit"
            owners={owners}
          />
        </div>
      </div>
    </section>
  );
}
