import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type ModulePageProps = {
  title: string;
  description: string;
  columns: string[];
  primaryMetric: string;
  secondaryMetric: string;
};

export function ModulePage({
  title,
  description,
  columns,
  primaryMetric,
  secondaryMetric,
}: ModulePageProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748b]">{description}</p>
        </div>
        <div className="flex gap-3">
          <div className="op-surface rounded-lg px-4 py-3">
            <div className="text-xs font-medium uppercase text-[#64748b]">
              Active
            </div>
            <div className="mt-1 text-lg font-semibold">{primaryMetric}</div>
          </div>
          <div className="op-surface rounded-lg px-4 py-3">
            <div className="text-xs font-medium uppercase text-[#64748b]">
              Attention
            </div>
            <div className="mt-1 text-lg font-semibold">{secondaryMetric}</div>
          </div>
        </div>
      </div>

      <div className="op-surface overflow-hidden rounded-lg">
        <div className="flex flex-col gap-3 border-b border-[#d9e1ea] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="font-medium">Records</div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge>Scaffolded</StatusBadge>
            <input
              aria-label="Search records"
              className="h-9 w-44 rounded-lg border border-[#d9e1ea] bg-[#f8fafc] px-3 text-sm text-[#64748b]"
              disabled
              placeholder="Search"
            />
            <select
              aria-label="Filter status"
              className="h-9 w-28 rounded-lg border border-[#d9e1ea] bg-[#f8fafc] px-3 text-sm text-[#64748b]"
              disabled
            >
              <option>Status</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase text-[#64748b]">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  className="px-4 py-4 text-center text-[#64748b]"
                  colSpan={columns.length}
                >
                  <EmptyState
                    description="This scaffolded table is ready for fictional demo records when the module workflow is connected."
                    title="No records loaded"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
