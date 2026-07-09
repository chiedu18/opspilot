import { describe, expect, it } from "vitest";

import {
  IssueCategory,
  IssueStatus,
  Priority,
} from "../../src/generated/prisma/client";
import {
  issueCreateSchema,
  issueListQuerySchema,
  issueUpdateSchema,
} from "../../src/features/issues/issue-validation";

describe("issue validation", () => {
  it("trims issue input and normalizes optional blanks", () => {
    const result = issueCreateSchema.parse({
      title: "  POS callback mismatch  ",
      category: IssueCategory.BUG,
      priority: Priority.HIGH,
      status: IssueStatus.OPEN,
      ownerId: "  team-daniel-kim  ",
      customerId: "  cust-northstar-outfitters  ",
      workItemId: "",
      description: "  QA found a callback mismatch.  ",
      resolutionNotes: "",
    });

    expect(result).toEqual({
      title: "POS callback mismatch",
      category: IssueCategory.BUG,
      priority: Priority.HIGH,
      status: IssueStatus.OPEN,
      ownerId: "team-daniel-kim",
      customerId: "cust-northstar-outfitters",
      workItemId: null,
      description: "QA found a callback mismatch.",
      resolutionNotes: null,
    });
  });

  it("rejects missing required issue fields", () => {
    const result = issueCreateSchema.safeParse({
      title: "",
      ownerId: "",
      description: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.title).toContain("Title is required.");
      expect(errors.ownerId).toContain("Owner is required.");
      expect(errors.description).toContain("Description is required.");
      expect(errors.category).toBeDefined();
      expect(errors.priority).toBeDefined();
      expect(errors.status).toBeDefined();
    }
  });

  it("requires resolution notes when creating resolved or closed issues", () => {
    const result = issueCreateSchema.safeParse({
      title: "Final assets confirmed",
      category: IssueCategory.SUPPORT_REQUEST,
      priority: Priority.MEDIUM,
      status: IssueStatus.RESOLVED,
      ownerId: "team-sofia-patel",
      description: "Support request completed.",
      resolutionNotes: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.resolutionNotes).toContain(
        "Resolution notes are required when resolving or closing an issue.",
      );
    }
  });

  it("allows partial updates without requiring every create field", () => {
    const result = issueUpdateSchema.parse({
      status: IssueStatus.IN_PROGRESS,
      resolutionNotes: "  QA is still reviewing callback logs.  ",
    });

    expect(result).toEqual({
      status: IssueStatus.IN_PROGRESS,
      resolutionNotes: "QA is still reviewing callback logs.",
    });
  });

  it("rejects empty issue updates", () => {
    const result = issueUpdateSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().formErrors).toContain(
        "At least one issue field must be provided.",
      );
    }
  });

  it("parses issue list filters", () => {
    const result = issueListQuerySchema.parse({
      archiveState: "ONLY",
      category: IssueCategory.BLOCKER,
      customerId: " cust-harborview-dental ",
      includeArchived: "false",
      ownerId: " team-marcus-reed ",
      priority: Priority.HIGH,
      q: " approval ",
      resolutionState: "UNRESOLVED",
      status: IssueStatus.BLOCKED,
      workItemId: " work-harborview-patient-reminders ",
    });

    expect(result).toEqual({
      archiveState: "ONLY",
      category: IssueCategory.BLOCKER,
      customerId: "cust-harborview-dental",
      includeArchived: false,
      ownerId: "team-marcus-reed",
      priority: Priority.HIGH,
      q: "approval",
      resolutionState: "UNRESOLVED",
      status: IssueStatus.BLOCKED,
      workItemId: "work-harborview-patient-reminders",
    });
  });
});
