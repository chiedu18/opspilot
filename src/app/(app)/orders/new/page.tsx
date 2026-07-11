import Link from "next/link";

import { OrderForm } from "@/features/orders/order-form";
import { getOrderCreatePageData } from "@/features/orders/order-page-data";

export default async function NewOrderPage() {
  const { customers, owners } = await getOrderCreatePageData();

  return (
    <section className="op-form-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Orders</p>
          <h2 className="mt-1 text-xl font-semibold">New order</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Add a fictional demo work item tied to a customer, owner, due date,
            priority, and estimated value.
          </p>
        </div>
        <Link
          className="op-button op-button-secondary px-4"
          href="/orders"
        >
          Back to orders
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Order details</h3>
        </div>
        <div className="p-4">
          <OrderForm
            action="/api/orders"
            cancelHref="/orders"
            customers={customers}
            initialValues={{
              customerId: customers[0]?.id ?? "",
              dueDate: "",
              estimatedValueCents: "",
              kind: "ORDER",
              notes: "",
              ownerId: "team-olivia-chen",
              priority: "MEDIUM",
              status: "DRAFT",
              title: "",
            }}
            method="POST"
            mode="create"
            owners={owners}
          />
        </div>
      </div>
    </section>
  );
}
