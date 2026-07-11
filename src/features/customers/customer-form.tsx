"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  editableCustomerStatusOptions,
  type CustomerFormValues,
  type CustomerOwnerChoice,
} from "./customer-ui";

type CustomerFormProps = {
  action: string;
  cancelHref: string;
  initialValues: CustomerFormValues;
  method: "PATCH" | "POST";
  mode: "create" | "edit";
  owners: CustomerOwnerChoice[];
};

type FieldErrors = Partial<Record<keyof CustomerFormValues, string[]>>;

const fieldNames = [
  "name",
  "contactName",
  "email",
  "phone",
  "status",
  "ownerId",
  "notes",
] as const satisfies readonly (keyof CustomerFormValues)[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const nullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const readSuccessCustomerId = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return typeof payload.data.id === "string" ? payload.data.id : null;
};

const readApiError = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return {
      fieldErrors: {},
      formErrors: ["The customer could not be saved. Try again."],
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

export function CustomerForm({
  action,
  cancelHref,
  initialValues,
  method,
  mode,
  owners,
}: CustomerFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CustomerFormValues>(initialValues);
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

  const updateValue = <TField extends keyof CustomerFormValues>(
    field: TField,
    value: CustomerFormValues[TField],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const fieldError = (field: keyof CustomerFormValues) => fieldErrors[field]?.[0];

  const inputClass = (field: keyof CustomerFormValues) =>
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
        contactName: values.contactName,
        email: nullableText(values.email),
        name: values.name,
        notes: nullableText(values.notes),
        ownerId: nullableText(values.ownerId),
        phone: nullableText(values.phone),
        status: values.status,
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

    const customerId = readSuccessCustomerId(payload);

    if (!customerId) {
      setFormErrors(["The customer was saved, but the response was incomplete."]);
      setIsSubmitting(false);
      return;
    }

    router.push(`/customers/${customerId}?${mode === "create" ? "created" : "saved"}=1`);
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
        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="name">
            Customer name
          </label>
          <input
            aria-describedby={fieldError("name") ? "name-error" : undefined}
            aria-invalid={Boolean(fieldError("name"))}
            className={inputClass("name")}
            disabled={isFormDisabled}
            id="name"
            name="name"
            onChange={(event) => updateValue("name", event.target.value)}
            value={values.name}
          />
          {fieldError("name") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="name-error">
              {fieldError("name")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="contactName"
          >
            Contact name
          </label>
          <input
            aria-describedby={
              fieldError("contactName") ? "contactName-error" : undefined
            }
            aria-invalid={Boolean(fieldError("contactName"))}
            className={inputClass("contactName")}
            disabled={isFormDisabled}
            id="contactName"
            name="contactName"
            onChange={(event) => updateValue("contactName", event.target.value)}
            value={values.contactName}
          />
          {fieldError("contactName") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="contactName-error">
              {fieldError("contactName")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="email">
            Email
          </label>
          <input
            aria-describedby={fieldError("email") ? "email-error" : undefined}
            aria-invalid={Boolean(fieldError("email"))}
            className={inputClass("email")}
            disabled={isFormDisabled}
            id="email"
            name="email"
            onChange={(event) => updateValue("email", event.target.value)}
            value={values.email}
          />
          {fieldError("email") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="email-error">
              {fieldError("email")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="phone">
            Phone
          </label>
          <input
            aria-describedby={fieldError("phone") ? "phone-error" : undefined}
            aria-invalid={Boolean(fieldError("phone"))}
            className={inputClass("phone")}
            disabled={isFormDisabled}
            id="phone"
            name="phone"
            onChange={(event) => updateValue("phone", event.target.value)}
            value={values.phone}
          />
          {fieldError("phone") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="phone-error">
              {fieldError("phone")}
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
                event.target.value as CustomerFormValues["status"],
              )
            }
            value={values.status}
          >
            {editableCustomerStatusOptions.map((option) => (
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
            <option value="">Unassigned</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
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
              ? "Saving customer"
              : mode === "create"
                ? "Create customer"
                : "Save changes"}
        </button>
      </div>
    </form>
  );
}
