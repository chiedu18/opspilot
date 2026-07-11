import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function IssueNotFound() {
  return (
    <section className="op-not-found-page space-y-5">
      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <EmptyState
          description="This issue may have been archived or removed from the fictional demo workspace. Return to active issues to continue."
          title="Issue not found"
        />
      </div>
      <Link
        className="op-button op-button-secondary px-4"
        href="/issues"
      >
        Back to issues
      </Link>
    </section>
  );
}
