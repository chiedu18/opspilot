import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function InventoryNotFound() {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-[#d9e1ea] bg-white">
        <EmptyState
          description="The requested inventory or asset record does not exist in the demo database."
          title="Inventory item not found"
        />
      </div>
      <Link
        className="inline-flex rounded-lg border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
        href="/inventory"
      >
        Back to inventory
      </Link>
    </section>
  );
}
