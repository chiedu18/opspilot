import Link from "next/link";

import { CustomerForm } from "@/features/customers/customer-form";
import { getCustomerOwnerChoices } from "@/features/customers/customer-page-data";

export default async function NewCustomerPage() {
  const owners = await getCustomerOwnerChoices();

  return (
    <section className="op-form-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Customers</p>
          <h2 className="mt-1 text-xl font-semibold">New customer</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Add a fictional demo customer with contact details, status, owner,
            and notes.
          </p>
        </div>
        <Link
          className="op-button op-button-secondary px-4"
          href="/customers"
        >
          Back to customers
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Customer details</h3>
        </div>
        <div className="p-4">
          <CustomerForm
            action="/api/customers"
            cancelHref="/customers"
            initialValues={{
              contactName: "",
              email: "",
              name: "",
              notes: "",
              ownerId: "team-olivia-chen",
              phone: "",
              status: "PROSPECT",
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
