"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  orderKindOptions,
  orderPriorityOptions,
  orderStatusOptions,
  type OrderCustomerChoice,
  type OrderFormValues,
  type OrderOwnerChoice,
} from "./order-ui";

type OrderFormProps = {
  action: string;
  cancelHref: string;
  customers: OrderCustomerChoice[];
  initialValues: OrderFormValues;
  method: "PATCH" | "POST";
  mode: "create" | "edit";
  owners: OrderOwnerChoice[];
};

type FieldErrors = Partial<Record<keyof OrderFormValues, string[]>>;

const fieldNames = [
  "title",
  "kind",
  "status",
  "priority",
  "dueDate",
  "estimatedValueCents",
  "customerId",
  "ownerId",
  "notes",
] as const satisfies readonly (keyof OrderFormValues)[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const nullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const estimatedValueToCents = (value: string) => {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const normalized = trimmed.replace(/[$,\s]/g, "");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return normalized;
  }

  return Math.round(amount * 100);
};

const readSuccessOrderId = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return typeof payload.data.id === "string" ? payload.data.id : null;
};

const readApiError = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return {
      fieldErrors: {},
      formErrors: ["The order could not be saved. Try again."],
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

export function OrderForm({
  action,
  cancelHref,
  customers,
  initialValues,
  method,
  mode,
  owners,
}: OrderFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<OrderFormValues>(initialValues);
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

  const updateValue = <TField extends keyof OrderFormValues>(
    field: TField,
    value: OrderFormValues[TField],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const fieldError = (field: keyof OrderFormValues) => fieldErrors[field]?.[0];

  const inputClass = (field: keyof OrderFormValues) =>
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
        customerId: values.customerId,
        dueDate: values.dueDate,
        estimatedValueCents: estimatedValueToCents(values.estimatedValueCents),
        kind: values.kind,
        notes: nullableText(values.notes),
        ownerId: values.ownerId,
        priority: values.priority,
        status: values.status,
        title: values.title,
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

    const orderId = readSuccessOrderId(payload);

    if (!orderId) {
      setFormErrors(["The order was saved, but the response was incomplete."]);
      setIsSubmitting(false);
      return;
    }

    router.push(`/orders/${orderId}?${mode === "create" ? "created" : "saved"}=1`);
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
          <label className="text-sm font-medium text-[#334155]" htmlFor="kind">
            Kind
          </label>
          <select
            aria-describedby={fieldError("kind") ? "kind-error" : undefined}
            aria-invalid={Boolean(fieldError("kind"))}
            className={inputClass("kind")}
            disabled={isFormDisabled}
            id="kind"
            name="kind"
            onChange={(event) =>
              updateValue("kind", event.target.value as OrderFormValues["kind"])
            }
            value={values.kind}
          >
            {orderKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("kind") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="kind-error">
              {fieldError("kind")}
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
                event.target.value as OrderFormValues["status"],
              )
            }
            value={values.status}
          >
            {orderStatusOptions.map((option) => (
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
                event.target.value as OrderFormValues["priority"],
              )
            }
            value={values.priority}
          >
            {orderPriorityOptions.map((option) => (
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
          <label className="text-sm font-medium text-[#334155]" htmlFor="dueDate">
            Due date
          </label>
          <input
            aria-describedby={
              fieldError("dueDate") ? "dueDate-error" : undefined
            }
            aria-invalid={Boolean(fieldError("dueDate"))}
            className={inputClass("dueDate")}
            disabled={isFormDisabled}
            id="dueDate"
            name="dueDate"
            onChange={(event) => updateValue("dueDate", event.target.value)}
            type="date"
            value={values.dueDate}
          />
          {fieldError("dueDate") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="dueDate-error">
              {fieldError("dueDate")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="estimatedValueCents"
          >
            Estimated value
          </label>
          <input
            aria-describedby={
              fieldError("estimatedValueCents")
                ? "estimatedValueCents-error"
                : undefined
            }
            aria-invalid={Boolean(fieldError("estimatedValueCents"))}
            className={inputClass("estimatedValueCents")}
            disabled={isFormDisabled}
            id="estimatedValueCents"
            inputMode="decimal"
            name="estimatedValueCents"
            onChange={(event) =>
              updateValue("estimatedValueCents", event.target.value)
            }
            placeholder="12500.00"
            value={values.estimatedValueCents}
          />
          {fieldError("estimatedValueCents") ? (
            <p
              className="mt-1 text-xs text-[#b91c1c]"
              id="estimatedValueCents-error"
            >
              {fieldError("estimatedValueCents")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="customerId"
          >
            Customer
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
            onChange={(event) => updateValue("customerId", event.target.value)}
            value={values.customerId}
          >
            <option value="">Choose customer</option>
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
      </div>

      <div>
        <label className="text-sm font-medium text-[#334155]" htmlFor="notes">
          Notes
        </label>
        <textarea
          aria-describedby={fieldError("notes") ? "notes-error" : undefined}
          aria-invalid={Boolean(fieldError("notes"))}
          className={`${inputClass("notes")} min-h-32 resize-y`}
          disabled={isFormDisabled}
          id="notes"
          name="notes"
          onChange={(event) => updateValue("notes", event.target.value)}
          value={values.notes}
        />
        {fieldError("notes") ? (
          <p className="mt-1 text-xs text-[#b91c1c]" id="notes-error">
            {fieldError("notes")}
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
              ? "Saving order"
              : mode === "create"
                ? "Create order"
                : "Save changes"}
        </button>
      </div>
    </form>
  );
}
