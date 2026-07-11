import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function OrderNotFound() {
  return (
    <section className="op-not-found-page space-y-5">
      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <EmptyState
          description="This order or campaign may have been archived or removed from the fictional demo workspace. Return to active orders to continue."
          title="Order not found"
        />
      </div>
      <Link
        className="op-button op-button-secondary px-4"
        href="/orders"
      >
        Back to orders
      </Link>
    </section>
  );
}
