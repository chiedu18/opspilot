import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArchiveCustomerButton } from "@/features/customers/archive-customer-button";
import {
  getCustomerListPageData,
  parseCustomerListFilters,
  readCustomerSearchParam,
  type CustomerSearchParams,
} from "@/features/customers/customer-page-data";
import { CustomerStatusBadge } from "@/features/customers/customer-status-badge";
import {
  customerFilterOptions,
  formatCustomerDate,
} from "@/features/customers/customer-ui";

type CustomersPageProps = {
  searchParams?: Promise<CustomerSearchParams>;
};

const inputClass =
  "h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]";

const actionLinkClass =
  "rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]";

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseCustomerListFilters(params);
  const archiveSuccess = readCustomerSearchParam(params.archived) === "1";

  if (!filters.success) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
            Customer filters could not be applied.
          </p>
        </div>
        <ErrorState
          description="Reset the customer filters and try loading the list again."
          title="Customer list unavailable"
        />
        <Link className={actionLinkClass} href="/customers">
          Reset filters
        </Link>
      </section>
    );
  }

  const { customers, metrics } = await getCustomerListPageData(filters.data);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Fictional demo accounts with contact details, ownership, status, and
            operational follow-up context.
          </p>
        </div>
        <Link
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
          href="/customers/new"
          prefetch={false}
        >
          New customer
        </Link>
      </div>

      {archiveSuccess ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          Customer archived and removed from the default list.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Open
          </div>
          <div className="mt-1 text-lg font-semibold">{metrics.open}</div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Follow-up
          </div>
          <div className="mt-1 text-lg font-semibold">
            {metrics.needsFollowUp}
          </div>
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
            className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto_auto] lg:items-end"
            key={`${filters.data.q ?? ""}:${filters.data.status ?? ""}`}
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
                placeholder="Company, contact, email, or phone"
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
                {customerFilterOptions.map((option) => (
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
              href="/customers"
            >
              Reset
            </Link>
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Customer records</h3>
          <p className="text-sm text-[#64748b]">{customers.length} shown</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Related</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-[#0f766e] hover:text-[#115e59]"
                        href={`/customers/${customer.id}`}
                      >
                        {customer.name}
                      </Link>
                      <div className="mt-1 text-xs text-[#64748b]">
                        {customer.notes ? customer.notes.slice(0, 96) : "No notes"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#334155]">
                        {customer.contactName}
                      </div>
                      <div className="mt-1 space-y-1 text-xs text-[#64748b]">
                        <div>{customer.email ?? "No email"}</div>
                        <div>{customer.phone ?? "No phone"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CustomerStatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#334155]">
                        {customer.owner?.name ?? "Unassigned"}
                      </div>
                      <div className="mt-1 text-xs text-[#64748b]">
                        {customer.owner?.email ?? "No owner email"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#475569]">
                      <div>{customer.counts.workItems} work items</div>
                      <div>{customer.counts.issues} issues</div>
                      <div>{customer.counts.inventoryItems} assets</div>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">
                      {formatCustomerDate(customer.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          aria-label={`View ${customer.name}`}
                          className={actionLinkClass}
                          href={`/customers/${customer.id}`}
                        >
                          View
                        </Link>
                        {customer.status !== "ARCHIVED" ? (
                          <>
                            <Link
                              aria-label={`Edit ${customer.name}`}
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
                        ) : (
                          <span className="rounded-lg border border-[#d9e1ea] px-3 py-2 text-sm font-semibold text-[#64748b]">
                            Read only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4" colSpan={7}>
                    <EmptyState
                      description="Try a different search term or status filter."
                      title="No matching customers"
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
