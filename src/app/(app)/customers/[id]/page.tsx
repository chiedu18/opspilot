import Link from "next/link";
import { notFound } from "next/navigation";

import { ArchiveCustomerButton } from "@/features/customers/archive-customer-button";
import {
  getCustomerDetail,
  readCustomerSearchParam,
  type CustomerSearchParams,
} from "@/features/customers/customer-page-data";
import { CustomerStatusBadge } from "@/features/customers/customer-status-badge";
import { formatCustomerDate } from "@/features/customers/customer-ui";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<CustomerSearchParams>;
};

const actionLinkClass =
  "rounded-lg border border-[#cbd5e1] px-4 py-2 text-center text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const customer = await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  const wasCreated = readCustomerSearchParam(query.created) === "1";
  const wasSaved = readCustomerSearchParam(query.saved) === "1";
  const isArchived = customer.status === "ARCHIVED" || Boolean(customer.archivedAt);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Customer record</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{customer.name}</h2>
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            {customer.contactName} is the primary contact for this fictional demo
            account.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className={actionLinkClass} href="/customers">
            Back to customers
          </Link>
          {!isArchived ? (
            <>
              <Link
                className={actionLinkClass}
                href={`/customers/${customer.id}/edit`}
              >
                Edit
              </Link>
              <ArchiveCustomerButton
                customerId={customer.id}
                customerName={customer.name}
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
          Customer {wasCreated ? "created" : "updated"} successfully.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Contact and ownership</h3>
          </div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Contact
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {customer.contactName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Owner
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {customer.owner?.name ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Email
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {customer.email ?? "No email recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {customer.phone ?? "No phone recorded"}
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
                {formatCustomerDate(customer.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Updated
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatCustomerDate(customer.updatedAt)}
              </dd>
            </div>
            {customer.archivedAt ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-[#64748b]">
                  Archived
                </dt>
                <dd className="mt-1 text-sm text-[#334155]">
                  {formatCustomerDate(customer.archivedAt)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Related workload</h3>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div className="text-xs font-semibold uppercase text-[#64748b]">
                Work items
              </div>
              <div className="mt-1 text-lg font-semibold">
                {customer.counts.workItems}
              </div>
            </div>
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div className="text-xs font-semibold uppercase text-[#64748b]">
                Issues
              </div>
              <div className="mt-1 text-lg font-semibold">
                {customer.counts.issues}
              </div>
            </div>
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div className="text-xs font-semibold uppercase text-[#64748b]">
                Assets
              </div>
              <div className="mt-1 text-lg font-semibold">
                {customer.counts.inventoryItems}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Notes</h3>
          </div>
          <div className="min-h-36 p-4 text-sm leading-6 text-[#334155]">
            {customer.notes ?? "No notes recorded."}
          </div>
        </div>
      </div>
    </section>
  );
}
