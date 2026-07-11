import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import { ArchiveIssueButton } from "@/features/issues/archive-issue-button";
import {
  IssueAttentionBadge,
  IssueCategoryBadge,
  IssuePriorityBadge,
  IssueResolutionBadge,
  IssueStatusBadge,
} from "@/features/issues/issue-badges";
import {
  getIssueDetail,
  readIssueSearchParam,
  type IssueSearchParams,
} from "@/features/issues/issue-page-data";
import {
  formatIssueCount,
  formatIssueDateTime,
} from "@/features/issues/issue-ui";

type IssueDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<IssueSearchParams>;
};

const actionLinkClass =
  "op-button op-button-secondary px-4";

const successMessage = ({
  closed,
  created,
  resolved,
  saved,
}: {
  closed: boolean;
  created: boolean;
  resolved: boolean;
  saved: boolean;
}) => {
  if (created) {
    return "Issue created successfully.";
  }

  if (resolved) {
    return "Issue resolved successfully.";
  }

  if (closed) {
    return "Issue closed successfully.";
  }

  if (saved) {
    return "Issue updated successfully.";
  }

  return null;
};

export default async function IssueDetailPage({
  params,
  searchParams,
}: IssueDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const issue = await getIssueDetail(id);

  if (!issue) {
    notFound();
  }

  const isArchived = Boolean(issue.archivedAt);
  const message = successMessage({
    closed: readIssueSearchParam(query.closed) === "1",
    created: readIssueSearchParam(query.created) === "1",
    resolved: readIssueSearchParam(query.resolved) === "1",
    saved: readIssueSearchParam(query.saved) === "1",
  });

  return (
    <section className="op-record-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Issue record</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{issue.title}</h2>
            <IssueCategoryBadge value={issue.category} />
            <IssuePriorityBadge value={issue.priority} />
            <IssueStatusBadge value={issue.status} />
            <IssueResolutionBadge isResolved={issue.isResolved} />
            <IssueAttentionBadge
              priority={issue.priority}
              status={issue.status}
            />
            {isArchived ? <StatusBadge tone="neutral">Archived</StatusBadge> : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Owned by {issue.owner?.name ?? "an unassigned team member"} for{" "}
            {issue.customer?.name ?? "internal operations"}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className={actionLinkClass} href="/issues">
            Back to issues
          </Link>
          {!isArchived ? (
            <>
              <Link className={actionLinkClass} href={`/issues/${issue.id}/edit`}>
                Edit
              </Link>
              <ArchiveIssueButton
                issueId={issue.id}
                issueTitle={issue.title}
              />
            </>
          ) : null}
        </div>
      </div>

      {message ? (
        <div
          className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-medium text-[#166534]"
          role="status"
        >
          {message}
        </div>
      ) : null}

      {isArchived ? (
        <div className="rounded-lg border border-[#d9e1ea] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
          Archived issues are retained as read-only records for related work,
          customer history, activity, reporting, and QA context.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Issue details</h3>
          </div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Owner
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {issue.owner?.name ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Owner email
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {issue.owner?.email ?? "No owner email"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Customer
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#334155]">
                {issue.customer ? (
                  <Link
                    className="op-text-link"
                    href={`/customers/${issue.customer.id}`}
                  >
                    {issue.customer.name}
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
                {issue.workItem ? (
                  <Link
                    className="op-text-link"
                    href={`/orders/${issue.workItem.id}`}
                  >
                    {issue.workItem.title}
                  </Link>
                ) : (
                  "No related order"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Resolution
              </dt>
              <dd className="mt-1">
                <IssueResolutionBadge isResolved={issue.isResolved} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Activity events
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatIssueCount(issue.counts.activityEvents)}
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
                {formatIssueDateTime(issue.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Updated
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatIssueDateTime(issue.updatedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#64748b]">
                Resolved
              </dt>
              <dd className="mt-1 text-sm text-[#334155]">
                {formatIssueDateTime(issue.resolvedAt)}
              </dd>
            </div>
            {issue.archivedAt ? (
              <div>
                <dt className="text-xs font-semibold uppercase text-[#64748b]">
                  Archived
                </dt>
                <dd className="mt-1 text-sm text-[#334155]">
                  {formatIssueDateTime(issue.archivedAt)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Description</h3>
          </div>
          <div className="min-h-36 p-4 text-sm leading-6 text-[#334155]">
            {issue.description}
          </div>
        </div>

        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Resolution notes</h3>
          </div>
          <div className="min-h-36 p-4 text-sm leading-6 text-[#334155]">
            {issue.resolutionNotes ?? "No resolution notes recorded."}
          </div>
        </div>
      </div>
    </section>
  );
}
