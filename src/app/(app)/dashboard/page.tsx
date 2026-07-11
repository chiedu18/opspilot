import { getDashboardSummary } from "@/features/dashboard/dashboard-data";
import { DashboardView } from "@/features/dashboard/dashboard-view";

const getConfiguredReferenceDate = () => {
  const configuredDate = process.env.OPSPILOT_DASHBOARD_REFERENCE_DATE;

  if (!configuredDate) {
    return undefined;
  }

  const referenceDate = new Date(configuredDate);

  return Number.isNaN(referenceDate.getTime()) ? undefined : referenceDate;
};

export default async function DashboardPage() {
  const summary = await getDashboardSummary({
    referenceDate: getConfiguredReferenceDate(),
  });

  return <DashboardView summary={summary} />;
}
