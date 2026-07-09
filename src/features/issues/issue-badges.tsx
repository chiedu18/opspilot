import { StatusBadge } from "@/components/ui/status-badge";

import {
  issueCategoryMeta,
  issuePriorityMeta,
  issueStatusMeta,
} from "./issue-ui";

type BadgeTone = React.ComponentProps<typeof StatusBadge>["tone"];

type IssueBadgeProps = {
  value: string;
};

export function IssueCategoryBadge({ value }: IssueBadgeProps) {
  const meta = issueCategoryMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function IssueStatusBadge({ value }: IssueBadgeProps) {
  const meta = issueStatusMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function IssuePriorityBadge({ value }: IssueBadgeProps) {
  const meta = issuePriorityMeta(value);

  return <StatusBadge tone={meta.tone as BadgeTone}>{meta.label}</StatusBadge>;
}

export function IssueResolutionBadge({ isResolved }: { isResolved: boolean }) {
  return isResolved ? (
    <StatusBadge tone="success">Resolved</StatusBadge>
  ) : (
    <StatusBadge tone="warning">Unresolved</StatusBadge>
  );
}

export function IssueAttentionBadge({
  priority,
  status,
}: {
  priority: string;
  status: string;
}) {
  if (status === "BLOCKED") {
    return <StatusBadge tone="danger">Blocked work</StatusBadge>;
  }

  if (priority === "URGENT") {
    return <StatusBadge tone="danger">Urgent</StatusBadge>;
  }

  if (priority === "HIGH") {
    return <StatusBadge tone="warning">High priority</StatusBadge>;
  }

  return null;
}
