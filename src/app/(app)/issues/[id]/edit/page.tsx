import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { IssueForm } from "@/features/issues/issue-form";
import { getIssueEditPageData } from "@/features/issues/issue-page-data";
import type { IssueFormValues } from "@/features/issues/issue-ui";

type EditIssuePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const actionLinkClass =
  "op-button op-button-secondary px-4";

export default async function EditIssuePage({ params }: EditIssuePageProps) {
  const { id } = await params;
  const data = await getIssueEditPageData(id);

  if (!data) {
    notFound();
  }

  const { customers, issue, owners, workItems } = data;
  const isArchived = Boolean(issue.archivedAt);

  if (isArchived) {
    return (
      <section className="op-form-page space-y-7">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Issues</p>
          <h2 className="mt-1 text-xl font-semibold">Edit {issue.title}</h2>
        </div>
        <ErrorState
          description="Archived issues are retained as read-only records in this workflow."
          title="Issue is archived"
        />
        <Link className={actionLinkClass} href={`/issues/${issue.id}`}>
          Back to issue
        </Link>
      </section>
    );
  }

  return (
    <section className="op-form-page space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Issues</p>
          <h2 className="mt-1 text-xl font-semibold">Edit {issue.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Update status, priority, owner, relationship context, description,
            and resolution notes for this fictional demo issue.
          </p>
        </div>
        <Link className={actionLinkClass} href={`/issues/${issue.id}`}>
          Back to issue
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Issue details</h3>
        </div>
        <div className="p-4">
          <IssueForm
            action={`/api/issues/${issue.id}`}
            cancelHref={`/issues/${issue.id}`}
            customers={customers}
            initialValues={{
              category: issue.category as IssueFormValues["category"],
              customerId: issue.customerId ?? "",
              description: issue.description,
              ownerId: issue.ownerId ?? "",
              priority: issue.priority as IssueFormValues["priority"],
              resolutionNotes: issue.resolutionNotes ?? "",
              status: issue.status as IssueFormValues["status"],
              title: issue.title,
              workItemId: issue.workItemId ?? "",
            }}
            method="PATCH"
            mode="edit"
            owners={owners}
            workItems={workItems}
          />
        </div>
      </div>
    </section>
  );
}
