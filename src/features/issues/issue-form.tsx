"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  issueCategoryOptions,
  issuePriorityOptions,
  issueStatusOptions,
  type IssueCustomerChoice,
  type IssueFormValues,
  type IssueOwnerChoice,
  type IssueWorkItemChoice,
} from "./issue-ui";

type IssueFormProps = {
  action: string;
  cancelHref: string;
  customers: IssueCustomerChoice[];
  initialValues: IssueFormValues;
  method: "PATCH" | "POST";
  mode: "create" | "edit";
  owners: IssueOwnerChoice[];
  workItems: IssueWorkItemChoice[];
};

type FieldErrors = Partial<Record<keyof IssueFormValues, string[]>>;

const fieldNames = [
  "title",
  "category",
  "priority",
  "status",
  "ownerId",
  "customerId",
  "workItemId",
  "description",
  "resolutionNotes",
] as const satisfies readonly (keyof IssueFormValues)[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const nullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const readSuccessIssueId = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return typeof payload.data.id === "string" ? payload.data.id : null;
};

const readApiError = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return {
      fieldErrors: {},
      formErrors: ["The issue could not be saved. Try again."],
    };
  }

  const details = payload.error.details;
  const fieldErrors: FieldErrors = {};
  const formErrors: string[] = [];

  if (isRecord(details)) {
    const apiFieldErrors = details.fieldErrors;

    if (isRecord(apiFieldErrors)) {
      for (const fieldName of fieldNames) {
        const messages = apiFieldErrors[fieldName];

        if (
          Array.isArray(messages) &&
          messages.every((message) => typeof message === "string")
        ) {
          fieldErrors[fieldName] = messages;
        }
      }
    }

    const apiFormErrors = details.formErrors;

    if (
      Array.isArray(apiFormErrors) &&
      apiFormErrors.every((message) => typeof message === "string")
    ) {
      formErrors.push(...apiFormErrors);
    }
  }

  if (typeof payload.error.message === "string" && formErrors.length === 0) {
    formErrors.push(payload.error.message);
  }

  return { fieldErrors, formErrors };
};

const successQueryFor = (mode: IssueFormProps["mode"], status: string) => {
  if (mode === "create") {
    return "created";
  }

  if (status === "RESOLVED") {
    return "resolved";
  }

  if (status === "CLOSED") {
    return "closed";
  }

  return "saved";
};

export function IssueForm({
  action,
  cancelHref,
  customers,
  initialValues,
  method,
  mode,
  owners,
  workItems,
}: IssueFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<IssueFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormDisabled = isSubmitting || !isReady;

  useEffect(() => {
    const readyTimer = window.setTimeout(() => setIsReady(true), 0);

    return () => window.clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    const firstInvalidField = fieldNames.find((field) => fieldErrors[field]?.length);

    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
    }
  }, [fieldErrors]);

  const updateValue = <TField extends keyof IssueFormValues>(
    field: TField,
    value: IssueFormValues[TField],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateCustomer = (customerId: string) => {
    setValues((current) => {
      const selectedWorkItem = workItems.find(
        (workItem) => workItem.id === current.workItemId,
      );

      return {
        ...current,
        customerId,
        workItemId:
          selectedWorkItem && selectedWorkItem.customerId !== customerId
            ? ""
            : current.workItemId,
      };
    });
    setFieldErrors((current) => ({
      ...current,
      customerId: undefined,
      workItemId: undefined,
    }));
  };

  const updateWorkItem = (workItemId: string) => {
    const selectedWorkItem = workItems.find(
      (workItem) => workItem.id === workItemId,
    );

    setValues((current) => ({
      ...current,
      customerId: selectedWorkItem?.customerId ?? current.customerId,
      workItemId,
    }));
    setFieldErrors((current) => ({
      ...current,
      customerId: undefined,
      workItemId: undefined,
    }));
  };

  const fieldError = (field: keyof IssueFormValues) => fieldErrors[field]?.[0];

  const inputClass = (field: keyof IssueFormValues) =>
    `op-field mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
      fieldError(field) ? "border-[#fca5a5]" : "border-[#cbd5e1]"
    }`;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrors([]);

    const response = await fetch(action, {
      body: JSON.stringify({
        category: values.category,
        customerId: nullableText(values.customerId),
        description: values.description,
        ownerId: values.ownerId,
        priority: values.priority,
        resolutionNotes: nullableText(values.resolutionNotes),
        status: values.status,
        title: values.title,
        workItemId: nullableText(values.workItemId),
      }),
      headers: { "Content-Type": "application/json" },
      method,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const apiError = readApiError(payload);
      setFieldErrors(apiError.fieldErrors);
      setFormErrors(apiError.formErrors);
      setIsSubmitting(false);
      return;
    }

    const issueId = readSuccessIssueId(payload);

    if (!issueId) {
      setFormErrors(["The issue was saved, but the response was incomplete."]);
      setIsSubmitting(false);
      return;
    }

    const successQuery = successQueryFor(mode, values.status);
    router.push(`/issues/${issueId}?${successQuery}=1`);
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {formErrors.length > 0 ? (
        <div
          className="op-form-error rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]"
          role="alert"
        >
          {formErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-[#334155]" htmlFor="title">
            Title
          </label>
          <input
            aria-describedby={fieldError("title") ? "title-error" : undefined}
            aria-invalid={Boolean(fieldError("title"))}
            className={inputClass("title")}
            disabled={isFormDisabled}
            id="title"
            name="title"
            onChange={(event) => updateValue("title", event.target.value)}
            value={values.title}
          />
          {fieldError("title") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="title-error">
              {fieldError("title")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="category"
          >
            Category
          </label>
          <select
            aria-describedby={
              fieldError("category") ? "category-error" : undefined
            }
            aria-invalid={Boolean(fieldError("category"))}
            className={inputClass("category")}
            disabled={isFormDisabled}
            id="category"
            name="category"
            onChange={(event) =>
              updateValue(
                "category",
                event.target.value as IssueFormValues["category"],
              )
            }
            value={values.category}
          >
            {issueCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("category") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="category-error">
              {fieldError("category")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="priority"
          >
            Priority
          </label>
          <select
            aria-describedby={
              fieldError("priority") ? "priority-error" : undefined
            }
            aria-invalid={Boolean(fieldError("priority"))}
            className={inputClass("priority")}
            disabled={isFormDisabled}
            id="priority"
            name="priority"
            onChange={(event) =>
              updateValue(
                "priority",
                event.target.value as IssueFormValues["priority"],
              )
            }
            value={values.priority}
          >
            {issuePriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("priority") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="priority-error">
              {fieldError("priority")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="status">
            Status
          </label>
          <select
            aria-describedby={fieldError("status") ? "status-error" : undefined}
            aria-invalid={Boolean(fieldError("status"))}
            className={inputClass("status")}
            disabled={isFormDisabled}
            id="status"
            name="status"
            onChange={(event) =>
              updateValue(
                "status",
                event.target.value as IssueFormValues["status"],
              )
            }
            value={values.status}
          >
            {issueStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("status") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="status-error">
              {fieldError("status")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="ownerId">
            Owner
          </label>
          <select
            aria-describedby={fieldError("ownerId") ? "ownerId-error" : undefined}
            aria-invalid={Boolean(fieldError("ownerId"))}
            className={inputClass("ownerId")}
            disabled={isFormDisabled}
            id="ownerId"
            name="ownerId"
            onChange={(event) => updateValue("ownerId", event.target.value)}
            value={values.ownerId}
          >
            <option value="">Choose owner</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
                {owner.status !== "ACTIVE" ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          {fieldError("ownerId") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="ownerId-error">
              {fieldError("ownerId")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="customerId"
          >
            Related customer
          </label>
          <select
            aria-describedby={
              fieldError("customerId") ? "customerId-error" : undefined
            }
            aria-invalid={Boolean(fieldError("customerId"))}
            className={inputClass("customerId")}
            disabled={isFormDisabled}
            id="customerId"
            name="customerId"
            onChange={(event) => updateCustomer(event.target.value)}
            value={values.customerId}
          >
            <option value="">No customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.archivedAt || customer.status === "ARCHIVED"
                  ? " (archived)"
                  : ""}
              </option>
            ))}
          </select>
          {fieldError("customerId") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="customerId-error">
              {fieldError("customerId")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="workItemId"
          >
            Related order
          </label>
          <select
            aria-describedby={
              fieldError("workItemId") ? "workItemId-error" : undefined
            }
            aria-invalid={Boolean(fieldError("workItemId"))}
            className={inputClass("workItemId")}
            disabled={isFormDisabled}
            id="workItemId"
            name="workItemId"
            onChange={(event) => updateWorkItem(event.target.value)}
            value={values.workItemId}
          >
            <option value="">No related order</option>
            {workItems.map((workItem) => (
              <option key={workItem.id} value={workItem.id}>
                {workItem.title} - {workItem.customer.name}
                {workItem.archivedAt ? " (archived)" : ""}
              </option>
            ))}
          </select>
          {fieldError("workItemId") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="workItemId-error">
              {fieldError("workItemId")}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          className="text-sm font-medium text-[#334155]"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          aria-describedby={
            fieldError("description") ? "description-error" : undefined
          }
          aria-invalid={Boolean(fieldError("description"))}
          className={`${inputClass("description")} min-h-32 resize-y`}
          disabled={isFormDisabled}
          id="description"
          name="description"
          onChange={(event) => updateValue("description", event.target.value)}
          value={values.description}
        />
        {fieldError("description") ? (
          <p className="mt-1 text-xs text-[#b91c1c]" id="description-error">
            {fieldError("description")}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-medium text-[#334155]"
          htmlFor="resolutionNotes"
        >
          Resolution notes
        </label>
        <textarea
          aria-describedby={
            fieldError("resolutionNotes")
              ? "resolutionNotes-error"
              : undefined
          }
          aria-invalid={Boolean(fieldError("resolutionNotes"))}
          className={`${inputClass("resolutionNotes")} min-h-32 resize-y`}
          disabled={isFormDisabled}
          id="resolutionNotes"
          name="resolutionNotes"
          onChange={(event) =>
            updateValue("resolutionNotes", event.target.value)
          }
          value={values.resolutionNotes}
        />
        {fieldError("resolutionNotes") ? (
          <p className="mt-1 text-xs text-[#b91c1c]" id="resolutionNotes-error">
            {fieldError("resolutionNotes")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#d9e1ea] pt-4 sm:flex-row sm:justify-end">
        <Link
          className="op-button op-button-secondary px-4"
          href={cancelHref}
        >
          Cancel
        </Link>
        <button
          className="op-button op-button-primary px-4"
          data-pending={isSubmitting || undefined}
          disabled={isFormDisabled}
          type="submit"
        >
          {!isReady
            ? "Preparing form"
            : isSubmitting
              ? "Saving issue"
              : mode === "create"
                ? "Create issue"
                : "Save changes"}
        </button>
      </div>
    </form>
  );
}
