import Link from "next/link";

import { IssueForm } from "@/features/issues/issue-form";
import { getIssueCreatePageData } from "@/features/issues/issue-page-data";

export default async function NewIssuePage() {
  const { customers, owners, workItems } = await getIssueCreatePageData();

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">Issues</p>
          <h2 className="mt-1 text-xl font-semibold">New issue</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748b]">
            Log a fictional demo bug, blocker, support request, fulfillment
            issue, or data-quality follow-up with owner and related work context.
          </p>
        </div>
        <Link
          className="rounded-lg border border-[#cbd5e1] px-4 py-2 text-center text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
          href="/issues"
        >
          Back to issues
        </Link>
      </div>

      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <div className="border-b border-[#d9e1ea] px-4 py-3">
          <h3 className="font-semibold">Issue details</h3>
        </div>
        <div className="p-4">
          <IssueForm
            action="/api/issues"
            cancelHref="/issues"
            customers={customers}
            initialValues={{
              category: "BUG",
              customerId: "",
              description: "",
              ownerId: "team-daniel-kim",
              priority: "MEDIUM",
              resolutionNotes: "",
              status: "OPEN",
              title: "",
              workItemId: "",
            }}
            method="POST"
            mode="create"
            owners={owners}
            workItems={workItems}
          />
        </div>
      </div>
    </section>
  );
}
