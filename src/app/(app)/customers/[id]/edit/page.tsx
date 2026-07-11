import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { CustomerForm } from "@/features/customers/customer-form";
import {
  getCustomerDetail,
  getCustomerOwnerChoices,
} from "@/features/customers/customer-page-data";
import type { CustomerFormValues } from "@/features/customers/customer-ui";

type EditCustomerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const actionLinkClass =
  "op-button op-button-secondary px-4";

const editableStatus = (status: string): CustomerFormValues["status"] => {
  if (status === "ACTIVE" || status === "PROSPECT" || status === "PAUSED") {
    return status;
  }

  return "PROSPECT";
};

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const [customer, owners] = await Promise.all([
    getCustomerDetail(id),
    getCustomerOwnerChoices(),
  ]);

  if (!customer) {
    notFound();
  }

  const isArchived = customer.status === "ARCHIVED" || Boolean(customer.archivedAt);

  if (isArchived) {
    return (
      <section className="op-form-page space-y-7">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Customers</p>
          <h2 className="mt-1 text-xl font-semibold">Edit {customer.name}</h2>
        </div>
        <ErrorState
          description="Archived customers are retained as read-only records in this workflow."
          title="Customer is archived"
        />
        <Link className={actionLinkClass} href={`/customers/${customer.id}`}>
          Back to customer
        </Link>
      </section>
    );
  }

  return (
    <section className="op-form-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Customers</p>
          <h2 className="mt-1 text-xl font-semibold">Edit {customer.name}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Update contact, status, ownership, and notes for this fictional demo
            customer.
          </p>
        </div>
        <Link className={actionLinkClass} href={`/customers/${customer.id}`}>
          Back to customer
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Customer details</h3>
        </div>
        <div className="p-4">
          <CustomerForm
            action={`/api/customers/${customer.id}`}
            cancelHref={`/customers/${customer.id}`}
            initialValues={{
              contactName: customer.contactName,
              email: customer.email ?? "",
              name: customer.name,
              notes: customer.notes ?? "",
              ownerId: customer.ownerId ?? "",
              phone: customer.phone ?? "",
              status: editableStatus(customer.status),
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
