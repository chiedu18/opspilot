import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ArchiveIssueButton } from "@/features/issues/archive-issue-button";
import {
  IssueAttentionBadge,
  IssueCategoryBadge,
  IssuePriorityBadge,
  IssueResolutionBadge,
  IssueStatusBadge,
} from "@/features/issues/issue-badges";
import {
  getIssueListPageData,
  parseIssueListFilters,
  readIssueSearchParam,
  type IssueSearchParams,
} from "@/features/issues/issue-page-data";
import {
  formatIssueCount,
  formatIssueDate,
  issueArchiveFilterOptions,
  issueCategoryOptions,
  issuePriorityOptions,
  issueResolutionFilterOptions,
  issueStatusOptions,
} from "@/features/issues/issue-ui";

type IssuesPageProps = {
  searchParams?: Promise<IssueSearchParams>;
};

const inputClass =
  "h-10 rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]";

const actionLinkClass =
  "rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]";

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseIssueListFilters(params);
  const archiveSuccess = readIssueSearchParam(params.archived) === "1";

  if (!filters.success) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Issues</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
            Issue filters could not be applied.
          </p>
        </div>
        <ErrorState
          description="Reset the issue filters and try loading the list again."
          title="Issue list unavailable"
        />
        <Link className={actionLinkClass} href="/issues">
          Reset filters
        </Link>
      </section>
    );
  }

  const { customers, hasFilters, issues, metrics, owners, workItems } =
    await getIssueListPageData(filters.data);
  const emptyTitle =
    metrics.tracked === 0 && !hasFilters
      ? "No issues yet"
      : "No matching issues";
  const emptyDescription =
    metrics.tracked === 0 && !hasFilters
      ? "Create the first support issue, blocker, bug, or QA follow-up."
      : "Try a different search term, category, priority, status, customer, order, owner, resolution, or archive filter.";

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Issues</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Fictional demo support issues, blockers, QA bugs, data-quality
            follow-up, ownership, resolution notes, and related work.
          </p>
        </div>
        <Link
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
          href="/issues/new"
          prefetch={false}
        >
          New issue
        </Link>
      </div>

      {archiveSuccess ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          Issue archived and removed from the default list.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Active records
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatIssueCount(metrics.tracked)}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Unresolved
          </div>
          <div className="mt-1 text-lg font-semibold text-[#b45309]">
            {formatIssueCount(metrics.unresolved)}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Blocked
          </div>
          <div className="mt-1 text-lg font-semibold text-[#b91c1c]">
            {formatIssueCount(metrics.blocked)}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            High priority
          </div>
          <div className="mt-1 text-lg font-semibold text-[#b91c1c]">
            {formatIssueCount(metrics.highPriority)}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3">
          <div className="text-xs font-medium uppercase text-[#64748b]">
            Archived
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatIssueCount(metrics.archived)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(150px,1fr))] 2xl:grid-cols-[minmax(220px,1.3fr)_repeat(8,minmax(140px,1fr))_auto_auto] 2xl:items-end"
            key={[
              filters.data.q ?? "",
              filters.data.category ?? "",
              filters.data.priority ?? "",
              filters.data.status ?? "",
              filters.data.customerId ?? "",
              filters.data.workItemId ?? "",
              filters.data.ownerId ?? "",
              filters.data.resolutionState ?? "",
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
                placeholder="Title, description, customer, order, or owner"
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
                {issueCategoryOptions.map((option) => (
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
                {issuePriorityOptions.map((option) => (
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
                {issueStatusOptions.map((option) => (
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
                htmlFor="resolutionState"
              >
                Resolution
              </label>
              <select
                className={`${inputClass} mt-1 w-full`}
                defaultValue={filters.data.resolutionState ?? ""}
                id="resolutionState"
                name="resolutionState"
              >
                {issueResolutionFilterOptions.map((option) => (
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
                {issueArchiveFilterOptions.map((option) => (
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
              href="/issues"
            >
              Reset
            </Link>
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Issue records</h3>
          <p className="text-sm text-[#64748b]">{issues.length} shown</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1540px] border-collapse text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
              <tr>
                <th className="px-4 py-3 font-semibold">Issue</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Related</th>
                <th className="px-4 py-3 font-semibold">Resolved</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {issues.length > 0 ? (
                issues.map((issue) => {
                  const isArchived = Boolean(issue.archivedAt);
                  const needsAttention =
                    !issue.isResolved &&
                    (issue.status === "BLOCKED" ||
                      issue.priority === "URGENT" ||
                      issue.priority === "HIGH");
                  const rowClass = needsAttention ? "bg-[#fff7ed]" : "";

                  return (
                    <tr key={issue.id} className={`align-top ${rowClass}`}>
                      <td className="px-4 py-3">
                        <Link
                          className="font-semibold text-[#0f766e] hover:text-[#115e59]"
                          href={`/issues/${issue.id}`}
                        >
                          {issue.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <IssueAttentionBadge
                            priority={issue.priority}
                            status={issue.status}
                          />
                          <IssueResolutionBadge
                            isResolved={issue.isResolved}
                          />
                        </div>
                        <div className="mt-2 text-xs leading-5 text-[#64748b]">
                          {issue.description.slice(0, 120)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <IssueCategoryBadge value={issue.category} />
                      </td>
                      <td className="px-4 py-3">
                        <IssuePriorityBadge value={issue.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <IssueStatusBadge value={issue.status} />
                          {isArchived ? (
                            <span className="rounded-md border border-[#d9e1ea] bg-[#f8fafc] px-2 py-1 text-xs font-semibold leading-none text-[#64748b]">
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {issue.owner?.name ?? "Unassigned"}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {issue.owner?.email ?? "No owner email"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">
                          {issue.customer ? (
                            <Link
                              className="text-[#0f766e] hover:text-[#115e59]"
                              href={`/customers/${issue.customer.id}`}
                            >
                              {issue.customer.name}
                            </Link>
                          ) : (
                            "No customer"
                          )}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b]">
                          {issue.workItem ? (
                            <Link
                              className="text-[#0f766e] hover:text-[#115e59]"
                              href={`/orders/${issue.workItem.id}`}
                            >
                              {issue.workItem.title}
                            </Link>
                          ) : (
                            "No related order"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {issue.resolvedAt
                          ? formatIssueDate(issue.resolvedAt)
                          : "Not resolved"}
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {formatIssueDate(issue.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-[#475569]">
                        {formatIssueCount(issue.counts.activityEvents)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            aria-label={`View ${issue.title}`}
                            className={actionLinkClass}
                            href={`/issues/${issue.id}`}
                          >
                            View
                          </Link>
                          {!isArchived ? (
                            <>
                              <Link
                                aria-label={`Edit ${issue.title}`}
                                className={actionLinkClass}
                                href={`/issues/${issue.id}/edit`}
                              >
                                Edit
                              </Link>
                              <ArchiveIssueButton
                                issueId={issue.id}
                                issueTitle={issue.title}
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
