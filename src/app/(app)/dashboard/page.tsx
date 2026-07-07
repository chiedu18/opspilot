import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

const metrics = [
  { label: "Active customers", value: "0", tone: "text-[#0f766e]" },
  { label: "Open orders", value: "0", tone: "text-[#2563eb]" },
  { label: "Overdue orders", value: "0", tone: "text-[#b45309]" },
  { label: "High-priority issues", value: "0", tone: "text-[#b91c1c]" },
  { label: "Low-stock inventory", value: "0", tone: "text-[#7c3aed]" },
  { label: "Completed this week", value: "0", tone: "text-[#15803d]" },
];

const workQueues = [
  "Customer records",
  "Orders and campaigns",
  "Inventory and assets",
  "Issues and tickets",
  "Reports and exports",
];

export default function DashboardPage() {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="mt-1 max-w-3xl text-sm text-[#64748b]">
          Manager view for active work, blocked items, and operational follow-up.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-[#d9e1ea] bg-white p-4"
          >
            <div className="text-sm text-[#64748b]">{metric.label}</div>
            <div className={`mt-3 text-3xl font-semibold ${metric.tone}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Work status</h3>
          </div>
          <div className="grid min-h-72 place-items-center px-4 py-8">
            <EmptyState
              description="Dashboard metrics will be connected after the core CRUD workflows are implemented."
              title="No chart data loaded"
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#d9e1ea] bg-white">
          <div className="border-b border-[#d9e1ea] px-4 py-3">
            <h3 className="font-semibold">Operations queues</h3>
          </div>
          <div className="divide-y divide-[#d9e1ea]">
            {workQueues.map((queue) => (
              <div
                key={queue}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="text-sm font-medium">{queue}</span>
                <StatusBadge tone="neutral">Scaffolded</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
