import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function CustomerNotFound() {
  return (
    <section className="op-not-found-page space-y-5">
      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <EmptyState
          description="This customer may have been archived or removed from the fictional demo workspace. Return to active customers to continue."
          title="Customer not found"
        />
      </div>
      <Link
        className="op-button op-button-secondary px-4"
        href="/customers"
      >
        Back to customers
      </Link>
    </section>
  );
}
